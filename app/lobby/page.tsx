import { requireAuth } from "@/lib/auth";

export default async function LobbyPage() {
  const user = await requireAuth();

  return (
    <div>
      <h1>Your Characters</h1>
    </div>
  );
}
