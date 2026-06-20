import Link from "next/link";
import { notFound } from "next/navigation";

const pages = {
  "performance-ads": {
    title: "Performance Ads",
    copy: "Fast tests, sharp hooks, funnels, metrics, and campaigns built to move.",
  },
  "stand-up": {
    title: "Stand-Up",
    copy: "Stage clips, crowd work, sharp writing, and the live-wire side of Devra.",
  },
  "content-creation": {
    title: "Content Creation",
    copy: "Reels, thumbnails, edits, formats, and social-first storytelling systems.",
  },
  blogs: {
    title: "Blogs",
    copy: "Essays, observations, drafts, and quieter pieces of the larger story.",
  },
  about: {
    title: "About Devra",
    copy: "Storyteller. Creator. Performer. Strategist.",
  },
} as const;

type Slug = keyof typeof pages;

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug as Slug];

  if (!page) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black px-8 py-16 text-white sm:px-16">
      <Link href="/" className="font-mono text-xs uppercase tracking-[0.35em] text-cyan-300">
        Back
      </Link>
      <h1 className="mt-16 font-mono text-5xl font-black uppercase sm:text-7xl">
        {page.title}
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-white/70">{page.copy}</p>
    </main>
  );
}
