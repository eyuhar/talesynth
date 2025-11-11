import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ClientStoryUI from "./[id]/ClientStoryUI";

export default async function GamePage() {
  const user = await requireAuth();

  return (
    <div className="p-8">
      <ClientStoryUI />
    </div>
  );
}
