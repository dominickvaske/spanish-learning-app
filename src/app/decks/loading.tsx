// Shown instantly while the page's database queries run.
// (Next.js wraps the page in a React <Suspense> boundary using this as the fallback.)
export default function Loading() {
  return <main className="mx-auto max-w-2xl p-8 text-zinc-500">Loading…</main>;
}
