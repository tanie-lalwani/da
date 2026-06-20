import Link from "next/link";

export default function BrandFilms() {
  return (
    <main className="min-h-screen bg-black px-8 py-16 text-white sm:px-16">
      <Link href="/" className="font-mono text-xs uppercase tracking-[0.35em] text-cyan-300">
        Back
      </Link>
      <h1 className="mt-16 font-mono text-5xl font-black sm:text-7xl">
        BRAND FILMS
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-white/70">
        Cinematic identity pieces, launches, and story-led campaigns from Devra&apos;s arcade descent.
      </p>
    </main>
  );
}
