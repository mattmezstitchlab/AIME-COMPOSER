// FIXTURE — preuve anti-faux-positifs : uniquement le pont officiel,
// ZÉRO écart attendu sur COLOR · SPACING · TYPOGRAPHY (et le total).
export default function App() {
  return (
    <main className="p-3 m-6 text-body bg-accent text-muted border-strong rounded-lg">
      <h1 className="text-h1">Titre</h1>
      <p className="p-[var(--aime-space-3)]">Contenu.</p>
      <button type="button" className="duration-200">Aller</button>
    </main>
  );
}
