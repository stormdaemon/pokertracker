import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BarChart3, Clock, Trophy, Wallet, Shield, Smartphone } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Poker Tracker Pro - Suivez vos sessions, analysez vos résultats",
  description:
    "Application gratuite pour tracker vos sessions de poker. Bankroll, statistiques, tournois, taux horaire - tout pour améliorer votre jeu.",
  openGraph: {
    title: "Poker Tracker Pro",
    description: "Suivez vos sessions de poker, analysez vos résultats et gérez votre bankroll.",
    type: "website",
  },
};

const features = [
  {
    icon: Clock,
    title: "Sessions en temps réel",
    description: "Timer intégré, buy-ins multiples, cash-out avec calcul instantané du profit.",
  },
  {
    icon: BarChart3,
    title: "Statistiques avancées",
    description: "Taux horaire, win rate, BB/h, graphiques par type de jeu, lieu et période.",
  },
  {
    icon: Wallet,
    title: "Gestion de bankroll",
    description: "Suivi des dépôts, retraits, solde en temps réel avec historique complet.",
  },
  {
    icon: Trophy,
    title: "Module tournois",
    description: "Tracking complet : buy-in, rebuys, ITM, ROI, position finale.",
  },
  {
    icon: Shield,
    title: "Données sécurisées",
    description: "Chiffrement bout-en-bout, hébergement EU, export RGPD de vos données.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first PWA",
    description: "Utilisez l'app depuis votre téléphone, même hors connexion.",
  },
];

export default async function HomePage() {
  let isAuthenticated = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) isAuthenticated = true;
  } catch {
    // Not authenticated
  }

  if (isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              PT
            </div>
            <span className="font-semibold text-lg">Poker Tracker Pro</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero section */}
        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Votre poker,{" "}
            <span className="text-primary">vos données</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Suivez chaque session, analysez vos performances et prenez de meilleures décisions
            grâce à des statistiques détaillées.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-primary text-primary-foreground px-6 py-3 text-base font-medium hover:bg-primary/90 transition-colors"
            >
              Créer un compte gratuit
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg border border-border px-6 py-3 text-base font-medium hover:bg-muted/50 transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </section>

        {/* Features grid */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Tout ce dont vous avez besoin
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 animate-fade-in-up"
              >
                <feature.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
          <div className="rounded-2xl bg-card border border-border p-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Prêt à améliorer votre jeu ?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Rejoignez Poker Tracker Pro et commencez à suivre vos sessions dès maintenant.
              100% gratuit, sans publicité.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-primary text-primary-foreground px-8 py-3 text-base font-medium hover:bg-primary/90 transition-colors"
            >
              Commencer maintenant
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Poker Tracker Pro. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-foreground transition-colors">Connexion</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Inscription</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
