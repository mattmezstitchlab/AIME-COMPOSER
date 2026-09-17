# TIMELINE UNIVERSELLE — V1

## Statut
PROPOSÉ — architecture de convergence, à valider avant moteur final.

## 1. Principe

Il n'existe qu'un moteur Timeline universel. Les projets ne chargent pas des Timelines différentes : ils chargent **un même modèle de données et un même moteur**, puis activent un **mode de projection** adapté au contexte.

`PROJECT → CANONICAL EVENT STREAM → TIMELINE ENGINE → MODE → VIEW`

La Timeline est une projection du projet, jamais une seconde source de vérité.

## 2. Modes

### READ
Lecture narrative. Aucun déplacement structurel.

### PLAN
Organisation métier. Déplacement d'étapes, moments, tâches ou jalons ; dates et relations restent cohérentes.

### COMPOSE
Montage créatif. Position temporelle, durée, couches, médias et clips sont manipulables. C'est le mode utilisé par Timeline Theater.

### REVIEW
Lecture annotée. Commentaires, propositions, décisions, versions et validations sont attachés aux événements ou segments.

### LIVE
Exécution / Jour J / opérationnel. Focus sur maintenant, prochain, retard, blocage et actions.

### HISTORY
Lecture des versions et changements. On voit ce qui a changé, quand, par qui et pourquoi.

## 3. Un seul événement universel

Chaque élément temporel suit le même contrat minimal :

```text
TimelineItem
  id
  project_id
  type
  title
  start
  duration?
  end?
  status?
  actor?
  source?
  entity_ref?
  parent_id?
  relation_ids[]
  media_refs[]
  evidence?
  version_id?
  decision_id?
  editable
  capabilities[]
```

`duration` est optionnelle : un jalon peut être ponctuel ; un moment peut s'étendre ; un clip peut avoir une durée ; une tâche peut avoir une fenêtre.

## 4. Capacités plutôt que variantes de Timeline

Un élément expose des capacités :

`MOVE | RESIZE | EDIT | COMMENT | LINK | MEDIA | SPLIT | MERGE | DUPLICATE | COMPLETE | LOCK`

Le mode du projet et les droits déterminent lesquelles sont actives.

Ainsi, le moteur n'a pas besoin d'une Timeline Mariage, d'une Timeline Studio, d'une Timeline Connect, d'une Timeline Théâtre, etc.

Il y a **Timeline Universelle + capacités + modes**.

## 5. Granularité

La Timeline doit fonctionner à plusieurs échelles sans changer de moteur :

`ANNÉE → MOIS → SEMAINE → JOUR → HEURE → MINUTE → SECONDE`

Le zoom change la représentation, pas les données.

## 6. Groupes et chapitres

Les éléments peuvent être regroupés :

`PROJECT → CHAPTER → GROUP → ITEM`

Exemples :
- Mariage → Avant → Préparatifs
- Mariage → Jour J → Cérémonie
- Web → Production → Design
- Studio → Composition → Hero
- Théâtre → Acte I → Scène 3

## 7. Relations

Une TimelineItem peut être liée à :

- une personne ;
- un fournisseur ;
- un document ;
- une tâche ;
- un média ;
- une version ;
- une décision ;
- une publication ;
- une autre TimelineItem.

La Timeline devient ainsi une **vue relationnelle temporelle**.

## 8. Règle fondamentale

Une action dans la Timeline ne doit jamais créer une copie concurrente d'une donnée canonique.

Déplacer un rendez-vous modifie son événement canonique.

Déplacer un clip modifie sa composition.

Changer une date métier déclenche les projections concernées.

Chaque changement important produit un événement / une décision traçable selon les contrats du projet.

## 9. Modes automatiques

Le projet peut proposer automatiquement le mode initial :

| Contexte | Mode initial |
|---|---|
| site web | PLAN / COMPOSE |
| mariage | PLAN / LIVE |
| événement | PLAN / LIVE |
| montage vidéo | COMPOSE |
| portfolio | READ / HISTORY |
| suivi client | REVIEW |
| production | PLAN / COMPOSE |

Ce mapping est une proposition de configuration, pas une nouvelle architecture.

## 10. Universal Timeline dans le Composer

Le bas du canvas doit afficher une Timeline compacte persistante.

Elle permet de :
- voir où se situe la composition ;
- naviguer vers un moment ;
- déplacer un élément si le mode l'autorise ;
- étendre/réduire sa durée si `RESIZE` est actif ;
- sélectionner un élément et synchroniser l'inspecteur ;
- suivre la tête de lecture ;
- changer de niveau de zoom ;
- basculer entre modes sans changer de données.

## 11. Séparation avec Timeline Theater

Timeline Theater apporte des primitives de composition temporelle concrètes : drag, resize, snap, zoom, chapitres, auto-follow et retiming.

Elles sont réutilisées dans le moteur universel en mode `COMPOSE`.

Le moteur universel ne doit donc pas recopier Timeline Theater ; il doit **absorber son comportement comme capability set**.

## 12. Règle d'UX

La Timeline ne doit pas devenir une deuxième application dans l'application.

Elle reste le système nerveux inférieur du Composer :

`CANVAS ↕ TIMELINE ↕ INSPECTOR`

Une sélection dans le canvas sélectionne la Timeline.

Une sélection dans la Timeline sélectionne le canvas.

L'inspecteur affiche le même objet.

Une seule sélection, trois projections.

## 13. Résultat recherché

```text
CARTE UNIVERSELLE
        ↓
      BRIEF
        ↓
     PROJECT
        ↓
 TIMELINE UNIVERSELLE
        ↓
 ┌──────┼────────┐
 ↓      ↓        ↓
PLAN  COMPOSE  LIVE
 ↓      ↓        ↓
REVIEW HISTORY  READ
        ↓
     COMPOSER
        ↓
   MEDIA LIBRARY
        ↓
   VERSION / QA
        ↓
   PUBLICATION
```

La diversité des projets ne produit donc plus une diversité de moteurs : elle produit une diversité de **modes et projections sur un même système**.
