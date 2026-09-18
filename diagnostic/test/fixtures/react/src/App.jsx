// FIXTURE — écarts plantés à la main (comptes attendus dans diagnostic/test/run.mjs) :
// p-5 = 20 px (SPACING, écran) · text-white (COLOR palette, écran) · bg-[#171410] (COLOR littéral, écran).
// m-1 = 4 px : dans l'échelle — jamais un écart. Titre h1 présent : HIERARCHY doit rester à 0.
// Totaux écran : SPACING 1 · COLOR 1. Densité sur écrans : 2.0.
export default function App() {
  return (
    <div className="p-5 m-1 text-white bg-[#171410]">
      <h1>Titre</h1>
    </div>
  );
}