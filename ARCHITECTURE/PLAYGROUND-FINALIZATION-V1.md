# AIME-COMPOSER — Playground Finalization V1

Passe de finalisation fonctionnelle et UX du Playground (`atlas/`).
Aucune nouvelle architecture, aucun nouveau moteur, aucune donnée métier fictive ajoutée.
Statut général : **PROTOYPE LOCAL — navigation et interactions réellement câblées, données locales uniquement.**

Date : 2026-09-17 · Branche : `fix/playground-navigation-finalization` (périmètre)

---

## 1. Problème identifié

**Double header / Playground imbriqué.** Le shell du Playground (`atlas/index.html`) charge chaque
expérience dans un iframe. Le logo interne des expériences était censé « revenir au Playground »,
mais certains chemins de retour naviguaient **à l'intérieur de l'iframe** (`location.href='./index.html'`),
rechargeant `index.html` dans la vue : deuxième header, deuxième navigation Composer / Carte /
Timeline / Grille, shell dupliqué, états incohérents.

État constaté à l'inspection (avant cette passe) :

| Fichier | Retour au Playground | Bug |
|---|---|---|
| `composer.html` | Logo `href="./index.html" target="_top"` (corrigé par PR #32) | aucun subsistant |
| `universal-card.html` | Bouton `← Composer` → `location.href='./index.html'` | **recharge le Playground dans l'iframe** (double header) + libellé mensonger (allait à l'accueil, pas au Composer) |
| `timeline.html` | Aucun (logo = `div` non cliquable) | pas de retour propre quand la vue est ouverte seule |
| `grid.html` | Aucun (logo = `div` non cliquable) | idem |

## 2. Cause

Aucun contrat partagé de navigation entre le shell et ses vues : chaque vue inventait son propre
retour (`location.href` nu, absence de lien, ou `target="_top"` isolé). `location.href` dans un
document embarqué navigue **ce document**, jamais le fenêtre supérieure — c'est exactement le
mécanisme du Playground imbriqué.

## 3. Correction

Le shell reste **seul propriétaire de la navigation**. Les vues ne recréent aucun shell.

**Contrat unique `data-playground-return`** :

1. Toute affordance de retour du Playground est un élément portant `data-playground-return`
   (logo dans les quatre vues ; plus le bouton `← Playground` de la Carte).
2. **Garantie sans JS / sans hook** : chaque logo est un `<a href="./index.html" target="_top">`
   → même si le shell ne peut pas intercepter (vue ouverte seule, désynchronisation, contexte
   externe), la navigation se fait au **niveau supérieur**, jamais dans l'iframe.
3. **Amélioration embarquée** : `index.html` écoute le `load` de l'iframe et remplace l'`onclick`
   de chaque `[data-playground-return]` par `returnToPlayground()` : retour instantané à
   l'accueil du shell, sans rechargement, avec focus renvoyé sur le bouton Accueil.
4. Fallback autonome de la Carte : le bouton `← Playground` cible d'abord la fenêtre
   supérieure (`window.top.location.href`) et ne retombe sur `location.href` qu'en cas d'accès
   refusé — plus jamais de navigation nue dans l'iframe.
5. Le logo du shell lui-même (`index.html`) fait un reset doux vers Accueil (pas de rechargement).

**Accessibilité de base (baseline, pas un audit WCAG)** :

- liens logo : `aria-label` + `title`, `:focus-visible` avec anneau fuchsia visible ;
- bouton Accueil marqué `aria-current="page"` (et maintenu à jour par la navigation) ;
- `iframe` avec `title` mis à jour à chaque vue active ;
- timeline : `nav aria-label="Modes de la Timeline"` ;
- bouton retour de la Carte : libellé honeste « ← Playground » + `aria-label`, `type="button"` ;
- focus visible ajouté sur `.btn`/`.mode`/`.tool`/`.node` là où il manquait.

**Composer — corrections ciblées (moteur non réécrit)** :

- `select()` appliquait la sélection à l'inspecteur **sans** mettre à jour l'anneau `.selected`
  des nœuds du canvas → état visuel incohérent (sélection fantôme). Corrigé : `select()` synchronise
  désormais la classe sur les nœuds présents.
- Nœuds atteignables au clavier : `tabindex=0`, `aria-label`, Entrée/Espace = sélection,
  `:focus-visible` cohérent. Suppr/Backspace et Échap fonctionnaient déjà.
- Vérifiés et conformes (non modifiés) : clic ≠ déplacement (seuil de drag réel de 4 px via
  `Math.hypot`), redessin des connexions pendant le drag, position finale synchronisée dans l'état
  (`dragEnd → render()`), compensation du scroll du canvas (`scrollLeft/scrollTop`), pointer capture.

## 4. Fichiers modifiés (5)

| Fichier | Nature du changement |
|---|---|
| `atlas/index.html` | Contrat `data-playground-return` (hook parent), `frame.title` par vue, `aria-current`, reset doux du logo shell, commentaires de propriété du shell |
| `atlas/composer.html` | `data-playground-return` sur le logo ; fix synchronisation `.selected` ; accessibilité clavier des nœuds |
| `atlas/universal-card.html` | Logo-lien conforme ; bouton « ← Composer » → « ← Playground » câblé en `window.top` ; styles `.brandLink`/focus |
| `atlas/timeline.html` | Logo-lien `target="_top"` + `data-playground-return` ; styles focus ; `aria-label` du rail de modes |
| `atlas/grid.html` | idem timeline (accent via `--pink`, variable locale de la vue) |

Aucun fichier d'audit, aucun projet source audité, aucune primitive du registre n'a été modifié.
Aucune nouvelle brique conceptuelle, aucun dashboard, aucune barre latérale, aucun pictogramme ajouté.

## 5. Comportement avant → après

| Situation | Avant | Après |
|---|---|---|
| Clic logo Composer (embarqué) | Retour Accueil via hook parent (PR #32) | inchangé + contrat unifié `data-playground-return` |
| Clic « ← Composer » Carte | Recharge `index.html` **dans l'iframe** → double header, double nav, second `title` | Hook parent → Accueil du shell, 1 seul header ; vue ouverte seule → navigation top-level vers le shell |
| Timeline / Grille ouvertes seules | Aucun moyen de revenir au Playground | Logo-lien `target="_top"` → `atlas/index.html` |
| Sélection d'un autre nœud au clic | Anneau fuchsia parfois figé sur l'ancien nœud | Anneau synchronisé immédiatement |
| Nœud au clavier | Inatteignable | Tab + Entrée sélectionne ; focus visible |
| Titre de l'iframe | Statique « AIME-COMPOSER Playground » | Suit la vue active (Composer, Carte Universelle, …) |

## 6. Tests réalisés

Exécutés le 2026-09-17 sur l'arborescence de travail réelle, via serveur HTTP statique + harness
fonctionnel (scripts exécutés, iframes réellement chargés) : **85 assertions, 0 échec, 0 erreur
console, 0 ressource 404.**

Couverture :

- Parcours complet §8 demandé : index → Composer → logo → accueil → Carte → retour → Timeline →
  retour → Grille → retour → Composer → ajout de primitive → déplacement (sous/seuil de drag) →
  connexion out→in → Preview ouvert/fermé → Export JSON capturé → Reset → Restaurer (localStorage)
  → Import d'un fichier JSON réel via le champ fichier → contrôle anti-duplication ;
- Les 4 vues : ouverture correcte, aucun iframe imbriqué, aucun second shell/nav dans la vue,
  logo conforme (`href`, `target="_top"`, `aria-label`, hook parent câblé), retour propre, navigation unique ;
- Click ≠ drag : clic pur = sélection sans mouvement ; mouvement < 4 px ignoré ; drag de 70×30 px
  appliqué exactement, positions synchronisées en state et en style, ligne SVG de connexion dessinée ;
- Carte : complétion réactive (5 % pour 1/20 champs), contrat anti-`location.href` nu vérifié dans la source ;
- Timeline : bascule de mode (info LIVE) ; Grille : changement de format (WEB 1440×900) et toggle magnétisme ;
- Vues ouvertes **seules** (hors shell) : logo-lien `./index.html` + `target="_top"` présents dans les 4 cas ;
- Reproduction du bug « avant » sur worktree de l'état précédent : la navigation nue de la Carte
  est bien interceptée par le moteur comme navigation du document lui-même (comportement source
  du Playground imbriqué dans un vrai navigateur) ; ce chemin n'existe plus après correction.

Limite de méthode : le bac à sable ne permettant pas d'exécuter un Chromium headless (binaires et
bibliothèques système inaccessibles), les tests réels ont été menés avec jsdom (DOM + scripts +
iframes réellement chargés sur HTTP, sans moteur de rendu). Les comportements layout/peinture
(couleurs, grilles CSS) restent à confirmer à l'œil dans un navigateur ; la direction visuelle n'a
pas été modifiée (mêmes variables noir/ivoire/fuchsia, aucune décoration ajoutée).

## 7. Erreurs / limites restantes (honnêtes)

1. **Aucune erreur console nouvelle** ; aucune erreur observée pendant les tests.
2. `removeAttribute('src')` lors du retour Accueil masque l'iframe (la vue reste en mémoire, cachée
   par le CSS du shell) — comportement volontaire, inchangé depuis l'existant.
3. Le dernier drag d'un nœud reconstruit le DOM (`render()`) → le focus clavier peut revenir au body
   après un drag souris. Sans impact au clic ; non traité (moteur existant, hors périmètre).
4. Les ports (création de connexion) restent souris-only — pas d'activation clavier des ports.
   Baseline prototype assumée, documentée, non auditée WCAG.
5. La navigation « douce » shell↔vue est limitée par `target="_top"` en repli : le clic logo depuis
   un contexte sans hook provoque un rechargement complet du shell (correct, non cosmétique).
6. Les placeholders/maquettes de Timeline (nœuds statiques) sont des données de démonstration,
   présentées comme telles ; aucun branchement réel n'est simulant un backend.

## 8. Toujours LOCAL / PROTOTYPE / DOCUMENTED ONLY

- **Backend / API / base de données : NON IMPLÉMENTÉ** — rien n'a été ajouté.
- **Authentification, connecteurs, Memory Engine, Universal Media Library, NOEMA runtime,
  Bureau, Financial Engine, Art Engine, moteur d'automatisation : DOCUMENTED ONLY**
  (voir les documents ARCHITECTURE/ correspondants — non modifiés).
- Composer : PROTOTYPE — état en `localStorage` (`aime-composer-workspace`), export/import JSON fichier ; aucun moteur canonique branché.
- Carte Universelle : LOCAL PROTOTYPE — persistance navigateur locale uniquement ; le « coffre » sensible est un avertissement de conception, pas un stockage sécurisé.
- Timeline : LOCAL PROTOTYPE sur maquette statique (contenu de démonstration assumé).
- Grille : LOCAL PROTOTYPE — outils locaux (formats, repères, magnétisme), sans source de données.
- Preview : LOCAL PROTOTYPE — projection des nœuds de la session, « proposition » sans validation engageante (NOEMA propose, l'humain valide — non implémenté ici).

## 9. Matrice de vérification finale

| Zone | État |
|---|---|
| Header Playground | CONNECTED (un seul shell, `aria-current`, titre dynamique) |
| Navigation (4 vues + Accueil) | CONNECTED (locale, vérifiée par tests réels) |
| Logo retour (4 vues + shell) | CONNECTED (hook + `target="_top"` garantis) |
| Composer (nœuds, drag, connexions, preview, JSON) | CONNECTED localement / PROTOTYPE (aucun moteur canonique) |
| Carte Universelle | LOCAL PROTOTYPE |
| Timeline Universelle | LOCAL PROTOTYPE (maquette) |
| Grille Universelle | LOCAL PROTOTYPE |
| Preview (Composition) | LOCAL PROTOTYPE |
| Export / Import JSON | LOCAL |
| Persistance Carte (localStorage) | LOCAL |
| Backend | NOT IMPLEMENTED |
| Connecteurs | NOT CONNECTED |
| NOEMA runtime | NOT IMPLEMENTED (DOCUMENTED ONLY) |

Aucun statut LOCAL/PROTOTYPE n'a été promu CONNECTED du fait de la seule existence de l'interface.
