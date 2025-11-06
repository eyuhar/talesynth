import { Button } from "@/components/ui/button";
import { logout } from "./actions/auth";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col gap-4 items-center pt-50">
      <h1 className="text-5xl font-black">TaleSynth</h1>
      <p className="text-xl text-muted-foreground">
        Dein KI-gesteuertes Abenteuer
      </p>
      <Button variant="outline" asChild>
        <Link href="/lobby">Spielen</Link>
      </Button>
      <Button className="cursor-pointer">
        <div onClick={logout}>Logout</div>
      </Button>
    </div>
  );
}
