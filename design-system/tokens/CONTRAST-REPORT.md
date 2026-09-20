# AIME — Rapport de contraste V1

Généré par `npm run build` le 2026-09-20. Toute valeur ci-dessous est calculée
selon la formule de luminance relative WCAG 2.x, puis comparée au seuil du rôle.
Le build échoue si une ligne est en échec : aucune couleur n'entre dans le système sans preuve.

## Règles de cible

| Rôle | Fonction | Cible | Justification |
|---|---|---|---|
| `text` / `text-muted` / `text-subtle` | contenu | 4.5:1 sur **toutes** les surfaces | WCAG 1.4.3 |
| `accent-text` | signal fuchsia lisible | 4.5:1 | le fuchsia n'est jamais décoratif |
| `accent-on` | texte sur remplissage fuchsia | 4.5:1 | WCAG 1.4.3 |
| `focus-ring` | anneau de focus | 3:1 | WCAG 2.4.11 |
| `border-strong` | arête qui **identifie** un contrôle | 3:1 | WCAG 1.4.11 |
| `border` | arête de contenant | 1.25:1 | perceptible, non identifiant |
| `border-subtle` | filet séparateur | 1.10:1 | décoratif assumé, jamais seul repère |

| Thème | Premier plan | Fond | Rapport | Seuil | Résultat | Rôle |
|---|---|---|---|---|---|---|
| dark | `text` | `background` | **18.05:1** | 4.5:1 | PASS | Texte courant sur fond de page |
| dark | `text` | `surface` | **17.62:1** | 4.5:1 | PASS | Texte courant sur surface |
| dark | `text` | `surface-elevated` | **17:1** | 4.5:1 | PASS | Texte courant sur surface élevée |
| dark | `text` | `surface-overlay` | **16.27:1** | 4.5:1 | PASS | Texte courant sur surface flottante |
| dark | `text-muted` | `background` | **11.95:1** | 4.5:1 | PASS | Texte secondaire sur fond de page |
| dark | `text-muted` | `surface` | **11.67:1** | 4.5:1 | PASS | Texte secondaire sur surface |
| dark | `text-muted` | `surface-elevated` | **11.26:1** | 4.5:1 | PASS | Texte secondaire sur surface élevée |
| dark | `text-muted` | `surface-overlay` | **10.78:1** | 4.5:1 | PASS | Texte secondaire sur surface flottante |
| dark | `text-subtle` | `background` | **7.88:1** | 4.5:1 | PASS | Texte méta sur fond de page |
| dark | `text-subtle` | `surface` | **7.7:1** | 4.5:1 | PASS | Texte méta sur surface |
| dark | `text-subtle` | `surface-elevated` | **7.42:1** | 4.5:1 | PASS | Texte méta sur surface élevée |
| dark | `text-subtle` | `surface-overlay` | **7.11:1** | 4.5:1 | PASS | Texte méta sur surface flottante |
| dark | `accent-text` | `background` | **8.42:1** | 4.5:1 | PASS | Fuchsia en texte sur fond de page |
| dark | `accent-text` | `surface` | **8.22:1** | 4.5:1 | PASS | Fuchsia en texte sur surface |
| dark | `accent-text` | `surface-elevated` | **7.93:1** | 4.5:1 | PASS | Fuchsia en texte sur surface élevée |
| dark | `accent-on` | `accent` | **5.86:1** | 4.5:1 | PASS | Texte sur remplissage fuchsia |
| dark | `accent` | `background` | **5.86:1** | 3:1 | PASS | Fuchsia en signal non textuel |
| dark | `focus-ring` | `background` | **8.42:1** | 3:1 | PASS | Anneau de focus (WCAG 2.4.11) |
| dark | `focus-ring` | `surface` | **8.22:1** | 3:1 | PASS | Anneau de focus sur surface |
| dark | `border-subtle` | `background` | **1.21:1** | 1.1:1 | PASS | Filet séparateur (non identifiant) |
| dark | `border-subtle` | `surface` | **1.18:1** | 1.1:1 | PASS | Filet séparateur sur surface |
| dark | `border` | `background` | **1.4:1** | 1.25:1 | PASS | Arête de contenant (non identifiante) |
| dark | `border` | `surface` | **1.37:1** | 1.25:1 | PASS | Arête de contenant sur surface |
| dark | `text-inverse` | `text` | **18.05:1** | 3:1 | PASS | Inversion texte/fond |
| dark | `border-strong` | `background` | **4.71:1** | 3:1 | PASS | Arête de contrôle sur fond de page |
| dark | `border-strong` | `surface` | **4.6:1** | 3:1 | PASS | Arête de contrôle sur surface |
| dark | `border-strong` | `surface-elevated` | **4.43:1** | 3:1 | PASS | Arête de contrôle sur surface élevée |
| dark | `border-strong` | `surface-overlay` | **4.24:1** | 3:1 | PASS | Arête de contrôle sur surface flottante |
| dark | `success-text` | `background` | **11.09:1** | 4.5:1 | PASS | success — état en texte sur fond |
| dark | `success-border` | `background` | **11.09:1** | 3:1 | PASS | success — état en bordure / repère |
| dark | `success-on-solid` | `success-solid` | **11.09:1** | 4.5:1 | PASS | success — texte sur remplissage d'état |
| dark | `warning-text` | `background` | **9.39:1** | 4.5:1 | PASS | warning — état en texte sur fond |
| dark | `warning-border` | `background` | **9.39:1** | 3:1 | PASS | warning — état en bordure / repère |
| dark | `warning-on-solid` | `warning-solid` | **9.39:1** | 4.5:1 | PASS | warning — texte sur remplissage d'état |
| dark | `error-text` | `background` | **8.77:1** | 4.5:1 | PASS | error — état en texte sur fond |
| dark | `error-border` | `background` | **8.77:1** | 3:1 | PASS | error — état en bordure / repère |
| dark | `error-on-solid` | `error-solid` | **8.77:1** | 4.5:1 | PASS | error — texte sur remplissage d'état |
| dark | `info-text` | `background` | **10.8:1** | 4.5:1 | PASS | info — état en texte sur fond |
| dark | `info-border` | `background` | **10.8:1** | 3:1 | PASS | info — état en bordure / repère |
| dark | `info-on-solid` | `info-solid` | **10.8:1** | 4.5:1 | PASS | info — texte sur remplissage d'état |
| light | `text` | `background` | **17.56:1** | 4.5:1 | PASS | Texte courant sur fond de page |
| light | `text` | `surface` | **19.17:1** | 4.5:1 | PASS | Texte courant sur surface |
| light | `text` | `surface-elevated` | **20.01:1** | 4.5:1 | PASS | Texte courant sur surface élevée |
| light | `text` | `surface-overlay` | **20.01:1** | 4.5:1 | PASS | Texte courant sur surface flottante |
| light | `text-muted` | `background` | **9.87:1** | 4.5:1 | PASS | Texte secondaire sur fond de page |
| light | `text-muted` | `surface` | **10.78:1** | 4.5:1 | PASS | Texte secondaire sur surface |
| light | `text-muted` | `surface-elevated` | **11.25:1** | 4.5:1 | PASS | Texte secondaire sur surface élevée |
| light | `text-muted` | `surface-overlay` | **11.25:1** | 4.5:1 | PASS | Texte secondaire sur surface flottante |
| light | `text-subtle` | `background` | **6.37:1** | 4.5:1 | PASS | Texte méta sur fond de page |
| light | `text-subtle` | `surface` | **6.96:1** | 4.5:1 | PASS | Texte méta sur surface |
| light | `text-subtle` | `surface-elevated` | **7.26:1** | 4.5:1 | PASS | Texte méta sur surface élevée |
| light | `text-subtle` | `surface-overlay` | **7.26:1** | 4.5:1 | PASS | Texte méta sur surface flottante |
| light | `accent-text` | `background` | **6.07:1** | 4.5:1 | PASS | Fuchsia en texte sur fond de page |
| light | `accent-text` | `surface` | **6.63:1** | 4.5:1 | PASS | Fuchsia en texte sur surface |
| light | `accent-text` | `surface-elevated` | **6.92:1** | 4.5:1 | PASS | Fuchsia en texte sur surface élevée |
| light | `accent-on` | `accent` | **4.65:1** | 4.5:1 | PASS | Texte sur remplissage fuchsia |
| light | `accent` | `background` | **4.08:1** | 3:1 | PASS | Fuchsia en signal non textuel |
| light | `focus-ring` | `background` | **6.07:1** | 3:1 | PASS | Anneau de focus (WCAG 2.4.11) |
| light | `focus-ring` | `surface` | **6.63:1** | 3:1 | PASS | Anneau de focus sur surface |
| light | `border-subtle` | `background` | **1.47:1** | 1.1:1 | PASS | Filet séparateur (non identifiant) |
| light | `border-subtle` | `surface` | **1.6:1** | 1.1:1 | PASS | Filet séparateur sur surface |
| light | `border` | `background` | **2.23:1** | 1.25:1 | PASS | Arête de contenant (non identifiante) |
| light | `border` | `surface` | **2.43:1** | 1.25:1 | PASS | Arête de contenant sur surface |
| light | `text-inverse` | `text` | **18.05:1** | 3:1 | PASS | Inversion texte/fond |
| light | `border-strong` | `background` | **6.37:1** | 3:1 | PASS | Arête de contrôle sur fond de page |
| light | `border-strong` | `surface` | **6.96:1** | 3:1 | PASS | Arête de contrôle sur surface |
| light | `border-strong` | `surface-elevated` | **7.26:1** | 3:1 | PASS | Arête de contrôle sur surface élevée |
| light | `border-strong` | `surface-overlay` | **7.26:1** | 3:1 | PASS | Arête de contrôle sur surface flottante |
| light | `success-text` | `background` | **4.71:1** | 4.5:1 | PASS | success — état en texte sur fond |
| light | `success-border` | `background` | **3.39:1** | 3:1 | PASS | success — état en bordure / repère |
| light | `success-on-solid` | `success-solid` | **5.18:1** | 4.5:1 | PASS | success — texte sur remplissage d'état |
| light | `warning-text` | `background` | **5.55:1** | 4.5:1 | PASS | warning — état en texte sur fond |
| light | `warning-border` | `background` | **3.43:1** | 3:1 | PASS | warning — état en bordure / repère |
| light | `warning-on-solid` | `warning-solid` | **5.12:1** | 4.5:1 | PASS | warning — texte sur remplissage d'état |
| light | `error-text` | `background` | **5.71:1** | 4.5:1 | PASS | error — état en texte sur fond |
| light | `error-border` | `background` | **4.22:1** | 3:1 | PASS | error — état en bordure / repère |
| light | `error-on-solid` | `error-solid` | **4.81:1** | 4.5:1 | PASS | error — texte sur remplissage d'état |
| light | `info-text` | `background` | **6.02:1** | 4.5:1 | PASS | info — état en texte sur fond |
| light | `info-border` | `background` | **4.26:1** | 3:1 | PASS | info — état en bordure / repère |
| light | `info-on-solid` | `info-solid` | **4.86:1** | 4.5:1 | PASS | info — texte sur remplissage d'état |

**80 / 80 paires conformes.**
