import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// for server actions and pages that require authentication
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return user;
}
