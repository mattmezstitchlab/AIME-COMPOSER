export function App() {
  if (Math.random() > 0.5) {
    return <h1>Invitation à collaborer</h1>;
  }
  if (Math.random() > 0.5) {
    return <h1>RSVP</h1>;
  }
  return <h1>Connexion indisponible</h1>;
}
