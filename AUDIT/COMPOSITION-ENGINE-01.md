# COMPOSITION-ENGINE-01 — Timeline Theater

## Statut
CONFIRMED — extraction documentaire directe depuis `timeline-theater`.

## Source
- Repository: `mattmezstitchlab/timeline-theater`
- Ref audité: `1e90d4c4b876024a38b58c817e46af8652d81386`
- Entrée principale: `src/components/studio/TimelineRuler.tsx`
- Route associée: `/studio`

## Ce qui est réellement confirmé

Timeline Theater possède une véritable surface de montage temporel, et non une simple timeline décorative.

La `TimelineRuler` reçoit des événements temporels et expose :
- position temporelle ;
- durée ;
- sélection ;
- déplacement par glisser-déposer ;
- redimensionnement de durée ;
- aimantation par pas de 5 minutes ;
- zoom 1× / 2× / 4× ;
- défilement horizontal ;
- chapitres consécutifs ;
- suivi automatique du moment sélectionné ;
- déplacement clavier par incréments de 5 ou 15 minutes ;
- réécriture via `onRetime(id, { time, duration_minutes })`.

La journée est représentée sur une plage 06:00 → 04:00 le lendemain. fileciteturn315file0

## Primitive extraite

**COMPOSITION TEMPORELLE**

```text
EVENT / SCENE
    ↓
POSITION
    ↓
DURATION
    ↓
CHAPTER
    ↓
EDIT / RETIME
    ↓
PREVIEW / EXPERIENCE
```

## Point architectural important

Le modèle actuel reste principalement :

```text
SCENE → MEDIA
```

alors que le moteur générique d'AIME-COMPOSER doit viser :

```text
ASSET
  ↓
CLIP
  ↓
POSITION
  ↓
DURATION
  ↓
LAYER
  ↓
COMPOSITION
```

Cela permettrait de prendre indépendamment :
- une section d'un projet ;
- un média d'un autre ;
- une structure d'un troisième ;
- une typographie ou un système visuel d'un quatrième ;
- puis de les assembler dans une composition sans modifier les dépôts sources.

## Réutilisation

**REUSE_ADAPT / COMPOSE**

Le composant est une référence forte pour le futur moteur de composition, mais son modèle métier est actuellement spécialisé autour du Jour J / mariage. La généralisation doit donc être architecturale, pas par copie de code.

## Garde-fous

- dépôt source inchangé ;
- aucune copie d'asset ;
- aucune donnée inventée ;
- distinction maintenue entre timeline métier et timeline de montage ;
- la composition future doit conserver la provenance des éléments réutilisés.

## Provenance minimale attendue

```text
source_project
source_path
source_component
source_asset
source_section
reuse_status
```

## Conclusion

Timeline Theater apporte à AIME-COMPOSER le noyau **COMPOSER / RETIME / CHAPTER / ZOOM / PREVIEW**. Il complète les primitives déjà extraites de DISPOO (narration), AIME Network (découverte), SILLAGE/Tempo (collaboration) et WEDDINGCITY (cascade/validation).
