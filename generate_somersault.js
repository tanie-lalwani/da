const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputPath = path.join(__dirname, 'public', 'sprites', 'somersault.png');

// Directories to update cleanly
const targetDirs = [
  path.join(__dirname, 'public', 'somersault'),
  path.join(__dirname, 'public', 'sprites', 'somersault'),
  path.join(__dirname, 'public', 'sprites', 'frames', 'somersault')
];

async function generateCleanFrames() {
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  // Clean directories so there are NO extra or duplicate files
  for (const dir of targetDirs) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(dir, { recursive: true });
  }

  const meta = await sharp(inputPath).metadata();
  const W = meta.width;
  const H = meta.height;

  const cols = 4;
  const rows = 2;
  const cellW = Math.floor(W / cols);
  const cellH = Math.floor(H / rows);

  console.log(`Extracting exactly 8 uncropped, pristine-quality frames (${cellW}x${cellH} each)...`);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const frameIdx = r * cols + c;
      const paddedIdx = String(frameIdx).padStart(3, '0');
      const filename = `somersault_${paddedIdx}.png`;

      const left = c * cellW;
      const top = r * cellH;

      // Clean extract without modifying any pixels or quality
      const frameBuffer = await sharp(inputPath)
        .extract({ left, top, width: cellW, height: cellH })
        .png({ quality: 100, compressionLevel: 6 })
        .toBuffer();

      for (const dir of targetDirs) {
        fs.writeFileSync(path.join(dir, filename), frameBuffer);
      }

      console.log(`✓ Created ${filename} (256x512)`);
    }
  }

  console.log("Done! Exactly 8 high-quality pictures saved.");
}

generateCleanFrames().catch(console.error);
