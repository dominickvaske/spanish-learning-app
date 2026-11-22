"use client";

import { useState } from "react";
import { SpanishInput } from "@/components/SpanishInput";

export default function Playground() {
  const [text, setText] = useState("");

  return (
    <main className="mx-auto flex flex-1 max-w-2xl flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Accent input playground</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Try: <code>n~</code> → ñ, <code>e&apos;</code> → é, <code>u&quot;</code> → ü,{" "}
        <code>??</code> → ¿, <code>!!</code> → ¡. Backspace right after a
        conversion undoes it.
      </p>
      <SpanishInput
        value={text}
        onChange={setText}
        placeholder="??Co'mo te llamas?"
      />
      <p className="text-sm text-zinc-500">Raw value: {JSON.stringify(text)}</p>
    </main>
  );
}
