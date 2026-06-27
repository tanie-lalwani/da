/**
 * Smart content-aware sprite frame extractor (v2).
 * - For sheets where characters don't overlap: auto-detect bounding boxes
 * - For sheets where characters overlap (run, fall, hit): forced grid split 
 *   with tight bounding-box trim within each cell
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SPRITES_DIR = path.join(__dirname, 'public', 'sprites');
const OUTPUT_DIR = path.join(__dirname, 'public', 'sprites', 'frames');
const WHITE_THRESHOLD = 235;
const PADDING = 14;

// mode: 'auto' = content-aware detection, 'grid' = force grid split
const SHEET_CONFIG = {
  idle: { cols: 5, rows: 2, pick: [0, 1, 2, 3, 4], mode: 'auto' },
  walk: { cols: 4, rows: 2, pick: [0, 1, 2, 3],    mode: 'auto' },
  run:  { cols: 4, rows: 2, pick: [4, 5, 6, 7],    mode: 'grid' }, // row2 is cleaner
  jump: { cols: 4, rows: 2, pick: [0, 1, 2, 3],    mode: 'auto' },
  fall: { cols: 4, rows: 2, pick: [0, 1, 2, 3],    mode: 'grid' }, // overlapping
  fun:  { cols: 4, rows: 2, pick: [0, 1, 2, 3],    mode: 'auto' },
  hit:  { cols: 4, rows: 2, pick: [0, 1, 2, 3],    mode: 'grid' }, // overlapping
};

async function loadTransparent(inputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  // Make white/near-white transparent
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
      pixels[i + 3] = 0;
    }
  }
  return { pixels, width: info.width, height: info.height };
}

function findBoundsInRegion(pixels, W, H, left, top, right, bottom) {
  let minX = right, maxX = left, minY = bottom, maxY = top;
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      if (pixels[(y * W + x) * 4 + 3] > 20) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x + 1);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + 1);
      }
    }
  }
  if (minX >= maxX) return null;
  return { left: minX, right: maxX, top: minY, bottom: maxY, width: maxX - minX, height: maxY - minY };
}

function findAutoRegions(pixels, W, H, rows) {
  const rowMid = Math.floor(H / rows);
  const allBounds = [];

  for (let r = 0; r < rows; r++) {
    const rowTop = r * rowMid;
    const rowBot = (r + 1) * rowMid;

    // Scan columns for content
    const colHasContent = new Array(W).fill(false);
    for (let x = 0; x < W; x++) {
      for (let y = rowTop; y < rowBot; y++) {
        if (pixels[(y * W + x) * 4 + 3] > 20) { colHasContent[x] = true; break; }
      }
    }

    // Find contiguous runs of content columns
    let inRun = false, runStart = 0;
    for (let x = 0; x <= W; x++) {
      if (x < W && colHasContent[x]) {
        if (!inRun) { inRun = true; runStart = x; }
      } else if (inRun) {
        inRun = false;
        if (x - runStart > 30) {
          const bounds = findBoundsInRegion(pixels, W, H, runStart, rowTop, x, rowBot);
          if (bounds) allBounds.push(bounds);
        }
      }
    }
  }
  return allBounds;
}

function findGridRegions(pixels, W, H, cols, rows) {
  const cellW = Math.floor(W / cols);
  const cellH = Math.floor(H / rows);
  const allBounds = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const left = c * cellW;
      const top = r * cellH;
      const right = left + cellW;
      const bottom = top + cellH;
      const bounds = findBoundsInRegion(pixels, W, H, left, top, right, bottom);
      if (bounds) allBounds.push(bounds);
      else allBounds.push({ left, right, top, bottom, width: cellW, height: cellH }); // fallback
    }
  }
  return allBounds;
}

function extractToCanvas(pixels, srcW, bounds, canvasW, canvasH) {
  const canvas = Buffer.alloc(canvasW * canvasH * 4, 0);
  const offsetX = Math.floor((canvasW - bounds.width) / 2);
  const offsetY = Math.floor((canvasH - bounds.height) / 2);

  for (let sy = bounds.top; sy < bounds.bottom; sy++) {
    for (let sx = bounds.left; sx < bounds.right; sx++) {
      const srcIdx = (sy * srcW + sx) * 4;
      const alpha = pixels[srcIdx + 3];
      if (alpha > 0) {
        const dx = (sx - bounds.left) + offsetX;
        const dy = (sy - bounds.top) + offsetY;
        if (dx >= 0 && dx < canvasW && dy >= 0 && dy < canvasH) {
          const dstIdx = (dy * canvasW + dx) * 4;
          canvas[dstIdx] = pixels[srcIdx];
          canvas[dstIdx + 1] = pixels[srcIdx + 1];
          canvas[dstIdx + 2] = pixels[srcIdx + 2];
          canvas[dstIdx + 3] = pixels[srcIdx + 3];
        }
      }
    }
  }
  return canvas;
}

async function processSheet(name, config) {
  const inputPath = path.join(SPRITES_DIR, `${name}.png`);
  if (!fs.existsSync(inputPath)) { console.log(`SKIP ${name}`); return 0; }

  const outputSubdir = path.join(OUTPUT_DIR, name);
  if (fs.existsSync(outputSubdir)) fs.rmSync(outputSubdir, { recursive: true });
  fs.mkdirSync(outputSubdir, { recursive: true });

  const { pixels, width: W, height: H } = await loadTransparent(inputPath);

  // Get frame bounds
  const allBounds = config.mode === 'auto'
    ? findAutoRegions(pixels, W, H, config.rows)
    : findGridRegions(pixels, W, H, config.cols, config.rows);

  console.log(`\n${name} [${config.mode}]: found ${allBounds.length} regions`);

  // Compute uniform canvas from picked frames
  let maxW = 0, maxH = 0;
  for (const idx of config.pick) {
    if (idx < allBounds.length) {
      maxW = Math.max(maxW, allBounds[idx].width);
      maxH = Math.max(maxH, allBounds[idx].height);
    }
  }
  const canvasW = maxW + PADDING * 2;
  const canvasH = maxH + PADDING * 2;
  console.log(`  canvas: ${canvasW}x${canvasH}`);

  let written = 0;
  for (const idx of config.pick) {
    if (idx >= allBounds.length) {
      console.log(`  ⚠ Frame ${idx} missing`);
      continue;
    }
    const bounds = allBounds[idx];
    const padded = String(written).padStart(3, '0');
    const outPath = path.join(outputSubdir, `${name}_${padded}.png`);

    const canvas = extractToCanvas(pixels, W, bounds, canvasW, canvasH);
    await sharp(canvas, { raw: { width: canvasW, height: canvasH, channels: 4 } })
      .png()
      .toFile(outPath);

    console.log(`  ✓ ${name}_${padded}.png (${bounds.width}x${bounds.height})`);
    written++;
  }
  return written;
}

async function main() {
  const results = {};
  for (const [name, config] of Object.entries(SHEET_CONFIG)) {
    results[name] = await processSheet(name, config);
  }
  console.log('\n=== Summary ===');
  for (const [name, count] of Object.entries(results)) {
    console.log(`${name}: ${count} frames`);
  }
}

main().catch(console.error);
