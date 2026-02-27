"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/sessions": "Sessions",
  "/sessions/new": "Nouvelle session",
  "/tournaments": "Tournois",
  "/stats": "Statistiques",
  "/bankroll": "Bankroll",
  "/locations": "Lieux",
  "/hand-notes": "Notes de main",
  "/settings": "Paramètres",
};

export function Header() {
  const pathname = usePathname();
  const title = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path)
  )?.[1] ?? "Poker Tracker";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4 lg:px-6">
      <Button variant="ghost" size="icon-sm" className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
