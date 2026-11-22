import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex flex-1 max-w-2xl flex-col justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold">¡Hola Estudiante! 👋</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Spanish practice app — flashcards coming soon.
      </p>
      <Link href="/decks" className="text-blue-600 underline">
        Go to your decks →
      </Link>
    </main>
  );
}
