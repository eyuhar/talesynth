"use client";

import { useState, useEffect } from "react";
import { getLastResponse, startStory } from "@/app/actions/story";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCharacter } from "@/app/actions/character";

export default function ClientStoryUI({ storyId }: { storyId?: string }) {
  const [lr, setLr] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(
    storyId || null
  );
  const [character, setCharacter] = useState<any>(null);

  const [characterName, setCharacterName] = useState("Roderick");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");

  useEffect(() => {
    async function fetchCharacter() {
      if (currentStoryId) {
        const charData = await getCharacter(currentStoryId);
        if (charData && charData.character) {
          setCharacter(charData.character);
        }
      }
    }
    fetchCharacter();
  }, [currentStoryId]);

  async function refresh(lastResponse?: any) {
    if (lastResponse) {
      setLr(lastResponse);
      return;
    }

    if (currentStoryId) {
      const r = await getLastResponse(currentStoryId);
      if (r.success) {
        setLr(r.lastResponse);
      }
    }
  }

  async function handleStart() {
    setLoading(true);
    const result = await startStory(characterName, gender);

    if (result.success && result.storyId) {
      setCurrentStoryId(result.storyId);
      await refresh();
    } else {
      console.error("Failed to start story:", result.error);
    }

    setLoading(false);
  }

  async function handleChoiceWithStreaming(choiceText: string) {
    if (!currentStoryId) return;

    setStreaming(true);
    setStreamingText("");
    setLoading(true);

    try {
      const response = await fetch("/api/story/continue-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: currentStoryId,
          userInput: choiceText,
        }),
      });

      if (!response.ok) throw new Error("Stream failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader available");

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;

              if (content) {
                buffer += content;
                console.log("Buffer so far:", buffer);

                // extract only story_text for display
                const displayText = extractStoryText(buffer);
                console.log("Extracted story_text:", displayText);
                if (displayText) {
                  setStreamingText(displayText);
                }
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      }

      // Parse final
      try {
        const cleanBuffer = buffer
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        const finalResponse = JSON.parse(cleanBuffer);
        setLr(finalResponse);
      } catch (e) {
        console.error("Parse error:", e);
      }

      const charData = await getCharacter(currentStoryId);
      if (charData && charData.character) {
        setCharacter(charData.character);
      }

      await refresh();
    } catch (error) {
      console.error("Streaming error:", error);
      alert("Failed to continue story. Please try again.");
    } finally {
      setStreaming(false);
      setLoading(false);
      setStreamingText("");
    }
  }

  useEffect(() => {
    if (currentStoryId) {
      refresh();
    }
  }, [currentStoryId]);

  // Character Creation Screen
  if (!currentStoryId || !lr) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">Create Your Character</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Character Name
            </label>
            <Input
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Enter character name"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Gender</label>
            <div className="flex gap-3">
              <Button
                variant={gender === "male" ? "default" : "outline"}
                onClick={() => setGender("male")}
                disabled={loading}
              >
                Male
              </Button>
              <Button
                variant={gender === "female" ? "default" : "outline"}
                onClick={() => setGender("female")}
                disabled={loading}
              >
                Female
              </Button>
              <Button
                variant={gender === "other" ? "default" : "outline"}
                onClick={() => setGender("other")}
                disabled={loading}
              >
                Other
              </Button>
            </div>
          </div>

          <Button
            onClick={handleStart}
            disabled={loading || !characterName.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? "Starting..." : "Start Adventure"}
          </Button>
        </div>
      </div>
    );
  }

  // Story Screen
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-slate-800 p-4 rounded-lg flex gap-6 text-sm">
        <div>
          <span className="text-background">HP:</span>{" "}
          <span className="text-red-400 font-bold">
            {character?.currentStats?.hp || 0}
          </span>
        </div>

        {character && (
          <div>
            <span className="text-background">Gold:</span>{" "}
            <span className="text-yellow-400">{character.goldCoins}</span>{" "}
            <span className="text-background">Silver:</span>{" "}
            <span className="text-slate-300">{character.silverCoins || 0}</span>{" "}
            <span className="text-background">Copper:</span>{" "}
            <span className="text-amber-600">{character.copperCoins || 0}</span>
          </div>
        )}

        {lr.enemies && lr.enemies.length > 0 && (
          <div className="ml-auto">
            <span className="text-red-500 font-bold">⚔️ IN COMBAT</span>
          </div>
        )}
      </div>

      {lr.enemies && lr.enemies.length > 0 && (
        <div className="bg-red-950 border border-red-800 p-4 rounded-lg space-y-2">
          <h3 className="font-bold text-red-400">Enemies:</h3>
          {lr.enemies.map((enemy: any, idx: number) => (
            <div key={idx} className="text-sm">
              <span className="font-semibold">{enemy.name}</span>
              {" - "}
              <span className="text-red-400">
                HP: {enemy.hp}/{enemy.maxHp}
              </span>
              {" | "}
              <span className="text-blue-400">Armor: {enemy.armor}</span>
              {" | "}
              <span className="text-orange-400">
                Dmg: {enemy.minDmg}-{enemy.maxDmg}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-300 p-6 rounded-lg min-h-[200px]">
        <p className="whitespace-pre-wrap text-base leading-relaxed">
          {streaming ? streamingText : lr.story_text}
        </p>

        {streaming && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <div className="animate-pulse">✍️ Writing</div>
            <div className="flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: "0s" }}>
                .
              </span>
              <span
                className="animate-bounce"
                style={{ animationDelay: "0.2s" }}
              >
                .
              </span>
              <span
                className="animate-bounce"
                style={{ animationDelay: "0.4s" }}
              >
                .
              </span>
            </div>
          </div>
        )}
      </div>

      {lr.inventory_changes && lr.inventory_changes.length > 0 && (
        <div className="bg-blue-950 border border-blue-800 p-4 rounded-lg">
          <h3 className="font-bold text-blue-400 mb-2">Inventory Changes:</h3>
          {lr.inventory_changes.map((item: any, idx: number) => (
            <div key={idx} className="text-sm">
              {item.quantity > 0 ? "📦 Gained: " : "❌ Lost: "}
              <span className="font-semibold">{item.name}</span>
              {" x"}
              {Math.abs(item.quantity)}
            </div>
          ))}
        </div>
      )}

      {lr.skills_used && lr.skills_used.length > 0 && (
        <div className="bg-purple-950 border border-purple-800 p-4 rounded-lg">
          <h3 className="font-bold text-purple-400 mb-2">Skills Used:</h3>
          {lr.skills_used.map((skill: any, idx: number) => (
            <div key={idx} className="text-sm">
              ⚡ {skill.skillId} (x{skill.usage_count})
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {lr.choices &&
          lr.choices.map((choice: any) => (
            <Button
              key={choice.id}
              variant="outline"
              onClick={() => handleChoiceWithStreaming(choice.text)}
              disabled={loading}
              className="w-full text-left justify-start h-auto py-3 px-4"
            >
              {choice.text}
            </Button>
          ))}
      </div>

      {loading && !streaming && (
        <div className="text-center text-slate-400 text-sm">
          Preparing story...
        </div>
      )}
    </div>
  );
}

// Helper Function
function extractStoryText(buffer: string): string {
  const match = buffer.match(/"story_text"\s*:\s*"((?:[^"\\]|\\.)*)"/);

  if (match && match[1]) {
    return match[1]
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .replace(/\\t/g, "\t");
  }

  return "";
}
