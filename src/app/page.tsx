export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold">¡Hola Estudiante! 👋</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Spanish practice app — flashcards coming soon.
      </p>
      <a href="/playground" className="text-blue-600 underline">
        Try the accent input →
      </a>
    </main>
  );
}
