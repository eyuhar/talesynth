"use client";

import { Button } from "@/components/ui/button";
import { deleteCharacter } from "../actions/characters";
import Link from "next/link";
import { JsonValue } from "@prisma/client/runtime/library";
import { startTransition, useState } from "react";
import { error } from "console";

type Character = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  stats: JsonValue;
  storyState: {
    id: string;
  } | null;
};

type CharacterListProps = {
  characters: Character[];
};

export default function CharacterList(characters: CharacterListProps) {
  const [error, setError] = useState<string | null>(null);

  function handleDeletion(e: React.FormEvent, id: string) {
    e.preventDefault();

    startTransition(async () => {
      const res = await deleteCharacter(id);

      if (res?.error) {
        setError(res.error);
        return;
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {characters.characters.map((char) => (
        <div key={char.id} className="flex gap-2 items-center">
          <p>{char.name}</p>
          <Button
            variant={"outline"}
            onClick={(e) => handleDeletion(e, char.id)}
          >
            Delete Character
          </Button>
          <Button variant={"outline"}>
            <Link href={`/game/${char.id}`}>Load Story</Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
