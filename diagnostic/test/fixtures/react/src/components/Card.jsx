// FIXTURE — écarts plantés : style inline color/fontSize/padding (CONSISTENCY x3)
// + padding 10px (SPACING fragment) + couleur littérale (COLOR fragment) + emoji (ICONOGRAPHY fragment).
// ATTENDU fragment : SPACING 1 · COLOR 1 · CONSISTENCY 3 · ICONOGRAPHY 1.
export function Card() {
  return <div style={{ color: '#ff3b30', fontSize: 13, padding: 10 }}>👍 carte</div>;
}
