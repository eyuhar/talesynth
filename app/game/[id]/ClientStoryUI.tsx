"use client";

import { useState, useEffect } from "react";
import {
  getLastResponse,
  startStory,
  continueStory,
} from "@/app/actions/story";
import { Button } from "@/components/ui/button";

export default function ClientStoryUI({
  characterId,
}: {
  characterId: string;
}) {
  const [lr, setLr] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const r = await getLastResponse(characterId);
    setLr(r.lastResponse);
  }

  async function handleStart() {
    setLoading(true);
    console.log("before");
    await startStory(characterId);
    console.log("after");
    await refresh();
    setLoading(false);
  }

  async function handleChoice(choice: string) {
    setLoading(true);
    console.log(`before ${characterId}`);
    const res = await continueStory(characterId, choice);
    console.log(res);
    await refresh();
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (!lr) {
    return (
      <Button variant={"outline"} onClick={handleStart}>
        start story
      </Button>
    );
  }

  return (
    <div>
      <p className="whitespace-pre-wrap text-base">{lr.story_text}</p>

      <div className="mt-4 space-y-2">
        {lr.choices.map((c: string) => (
          <Button variant={"outline"} key={c} onClick={() => handleChoice(c)}>
            {c}
          </Button>
        ))}
      </div>

      <div className="mt-6 text-sm">HP: {lr.stats.hp}</div>
    </div>
  );
}
