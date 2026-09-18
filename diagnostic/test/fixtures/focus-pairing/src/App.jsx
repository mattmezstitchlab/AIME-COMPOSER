// FIXTURE — pairing FOCUS (pont §9). Quatre attributs, comptes exacts :
//  1. valide     → focus-visible:outline-none + focus-visible:ring-* : PAS un écart ;
//  2. nu         → outline-none seul : écart ;
//  3. pointeur   → focus:outline-none seul (suppression au pointeur) : écart (pas de
//                 substitution clavier) ;
//  4. incomplète → focus-visible:outline-none + ring-* nu (ring sans scope focus-visible:,
//                 ne substitue rien au clavier) : écart.
// ATTENDU : FOCUS = 3 (nu, pointeur, incomplète), comme l'inventaire réel des
// paires non appariées — 218 → 217 → ~3, pas 133 faux positifs.
export default function App() {
  return (
    <div>
      <h1>Pairing FOCUS</h1>
      <button type="button" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Valide</button>
      <button type="button" className="outline-none">Nu</button>
      <button type="button" className="focus:outline-none">Pointeur</button>
      <button type="button" className="focus-visible:outline-none ring-2">Incomplète</button>
    </div>
  );
}
