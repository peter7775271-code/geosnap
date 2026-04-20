interface ShareCardPageProps {
  searchParams: {
    score?: string;
    distance?: string;
    rounds?: string;
  };
}

export default function ShareCardPage({ searchParams }: ShareCardPageProps) {
  const score = Number(searchParams.score ?? 0);
  const distance = Number(searchParams.distance ?? 0);
  const rounds = Number(searchParams.rounds ?? 0);

  return (
    <main className="mx-auto flex min-h-svh max-w-xl items-center px-4 py-10">
      <article className="w-full rounded-3xl border border-muted/30 bg-surface p-8 shadow-glow">
        <p className="mono text-xs uppercase tracking-[0.2em] text-accent">GeoSnap Results</p>
        <h1 className="mt-3 text-4xl font-black text-primary">{score.toLocaleString()} pts</h1>
        <p className="mt-2 text-sm text-muted">
          {rounds} rounds · {distance.toLocaleString()} km avg distance
        </p>
        <p className="mt-8 text-sm text-muted">
          GeoGuessr energy, but with your own photos and your own memories.
        </p>
      </article>
    </main>
  );
}
