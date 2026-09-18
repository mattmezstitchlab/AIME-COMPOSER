import { Page } from "./Page";
export function TestPage() {
  // ce fichier contient 2 h1 — comme les tests de byaime qui rendaient 2 h1
  // avant le fix il aurait été compté comme écran à 2 h1 (écart), après il est exclu
  return <div><h1>Faux</h1><h1>Faux2</h1></div>;
}
