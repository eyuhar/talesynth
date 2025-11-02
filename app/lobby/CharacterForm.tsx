"use client";

import { useState, useTransition } from "react";
import { createCharacter } from "../actions/characters";

export default function CharacterForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const res = await createCharacter(
        new FormData(e.target as HTMLFormElement)
      );

      if (res?.error) {
        setError(res.error);
        return;
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm space-y-4 mb-8"
    >
      <h2 className="text-xl font-semibold text-gray-800">Create Character</h2>

      <input
        className="border rounded-md px-3 py-2 w-full"
        value={name}
        onChange={(e) => setName(e.target.value)}
        name="name"
        placeholder="Character name"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        disabled={isPending}
        className="w-full bg-blue-600 text-white py-2 rounded-md"
      >
        {isPending ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
