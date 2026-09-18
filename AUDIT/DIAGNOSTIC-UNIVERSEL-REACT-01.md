# DIAGNOSTIC UNIVERSEL V2 — rapport d’exemple

> Généré par `node diagnostic/diagnose.mjs <clone nails-profile> --json`,
> mis en forme par script le 18 septembre 2026. Aucun chiffre n’est recopié
> à la main : tout sort de la mesure. Le clone est jetable (diagnostic/.work/).

## Projet jugé

**mattmezstitchlab/nails-profile** — branche par défaut, clone peu profond.

| | |
|---|---|
| Profil moteur | Next · React · Tailwind v3
| Pont officiel | non
| Écrans | 18 (0 documents, 18 routes)
| Fragments | 10
| Écarts sur écrans | 660
| Densité par écran | 36.7
| Écarts sur fragments | 99
| Constructions non résolues | 166

## Familles (écr · frag)

| Famille | Écarts | Écrans | Fragments |
|---|---:|---:|---:|
| ALIGNMENT | 185 | 174 | 10 |
| SPACING | 167 | 137 | 29 |
| TYPOGRAPHY | 78 | 74 | 4 |
| COLOR | 292 | 247 | 30 |
| ICONOGRAPHY | 25 | 1 | 24 |
| HIERARCHY | 13 | 13 | 0 |
| RESPONSIVE | 0 | 0 | 0 |
| OVERFLOW | 0 | 0 | 0 |
| FOCUS | 5 | 5 | 0 |
| MOTION | 18 | 9 | 0 |
| CONSISTENCY | 2 | 0 | 2 |

## Écrans les plus touchés

| Écran | Écarts |
|---|---:|
| `src/app/page.tsx` | 92 |
| `src/app/create/result/page.tsx` | 72 |
| `src/app/scan/page.tsx` | 52 |
| `src/app/create/page.tsx` | 50 |
| `src/app/explore/page.tsx` | 46 |
| `src/app/explore/[id]/page.tsx` | 42 |
| `src/app/create/publish/page.tsx` | 38 |
| `src/app/scan/profile/page.tsx` | 35 |

## Ce que le même jugement prouve

- **Le moteur est nommé** : Next + React + Tailwind v3, détectés par lecture
  des manifests — le code du projet n’est jamais exécuté.
- **Routes vs fragments** : src/app/**/page.tsx sont jugés comme écrans ; les
  autres composants sont mesurés à part pour garder la densité comparable.
- **Non résolu publié** : les classes dynamiques sont comptées, jamais devinées.

## Non mesuré

- CONTRAST — décrit le Design System, pas le projet
- la mise en page réelle (géométrie, débordements, cibles) — jsdom n'a pas de moteur de layout ; voir le mode rendu (opt-in)
- 166 construction(s) dynamique(s) de classes — non résolues, jamais devinées

