export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-background">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary">Poker Tracker Pro</h1>
        <p className="text-muted-foreground mt-1">Trackez. Analysez. Progressez.</p>
      </div>
      {children}
    </div>
  );
}
