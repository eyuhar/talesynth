"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { JsonValue } from "@prisma/client/runtime/library";
import { startTransition, useState } from "react";
import { error } from "console";

export default function StoryList(props: {
  stories: { id: string; name: string | null }[];
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {props.stories.map((story) => (
        <div key={story.id} className="flex gap-2 items-center">
          <p>{story.name}</p>
          <Button variant={"outline"}>
            <Link href={`/game/${story.id}`}>Load Story</Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
