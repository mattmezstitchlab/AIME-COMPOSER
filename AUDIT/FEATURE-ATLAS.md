# FEATURE ATLAS — AIME-COMPOSER

> Phase 2 — inventaire fonctionnel fondé sur les dépôts existants.
>
> Objectif : identifier les briques réellement présentes, leurs usages, leurs maturités et leurs possibilités de convergence. Ce document ne constitue pas encore une architecture cible et ne modifie aucun dépôt source.

## 1. Méthode

Les fonctionnalités sont classées selon quatre niveaux de preuve :

- **Documenté** : explicitement décrit dans la documentation du dépôt.
- **Confirmé par code** : identifiable dans les fichiers du dépôt.
- **À vérifier** : signalé par le projet mais nécessitant une inspection plus fine.
- **Concept** : intention produit non considérée comme fonctionnalité existante.

Principe : **le nom d'un dépôt ou une idée de README ne suffit pas à déclarer une fonctionnalité comme construite.**

---

## 2. AIME — réseau et rencontres

### Source : `aime-network`

README et spécification produit documentent les briques suivantes :

| Domaine | Fonction | Preuve | Réutilisabilité potentielle |
|---|---|---|---|
| Identité | Carte AIME représentant personne, professionnel, entreprise, organisme, lieu, service, événement ou ressource | Documenté | Très élevée |
| Intention | AIME avec plusieurs intentions : aimer, collaborer, réserver, recommander, associer, contacter, enregistrer | Documenté | Très élevée |
| IA | Compréhension d'une intention en langage naturel | Documenté | Très élevée |
| Recherche | Analyse de localisation, budget, date, style, nombre de personnes, besoins et contraintes | Documenté | Élevée |
| Rencontres | Proposition de rencontres entre cartes | Documenté | Très élevée |
| Composition | Assemblage de plusieurs cartes dans une composition | Documenté | Très élevée |
| Compatibilité | Explication de compatibilités entre éléments | Documenté | Élevée |
| Registre | Taxonomie universelle de personnes, professionnels, organismes, lieux, services, ressources et événements | Documenté | Très élevée |
| États | Disponible, indisponible, nouveau, vérifié, populaire, recommandé, relation | Documenté | Élevée |
| Profil | Recto/verso avec présentation, compétences, expériences, disponibilités, portfolio, relations, avis, préférences et statistiques | Documenté | Élevée |
| Taxonomie | Support de plusieurs univers et types d'événements | Documenté | Très élevée |
| Design system | Cards, boutons, badges, avatars, surfaces IA, navigation, modales, sheets, tags, filtres, états | Documenté | Élevée |
| UX adaptative | Apprentissage progressif plutôt que formulaires longs | Documenté | Très élevée |

### Observation

`aime-network` constitue une **couche de relation et d'intention**, plus qu'un simple annuaire. Cette couche peut potentiellement devenir transversale à plusieurs produits de l'écosystème.

Source : README du dépôt `aime-network`. fileciteturn12file0L2-L7

---

## 3. DISPOO — réservation et orchestration professionnelle

### Source : `dispoo`

Le README décrit une architecture de réservation universelle, actuellement publiée avec un positionnement mariage.

| Domaine | Fonction | Preuve | Réutilisabilité potentielle |
|---|---|---|---|
| Recherche | Recherche d'un professionnel, d'une prestation, d'une catégorie, d'une ville ou d'une zone | Documenté | Très élevée |
| Profil pro | Page publique d'un professionnel | Documenté | Très élevée |
| Prestations | Description, durée, prix, disponibilité, modalités et options | Documenté | Très élevée |
| Booking | Parcours prestation → date → créneau → coordonnées → confirmation | Documenté | Très élevée |
| Demande sur mesure | Demande → estimation → devis → validation → réservation | Documenté | Très élevée |
| Tarification | Tarif fixe, dynamique ou demande de devis | Documenté | Élevée |
| Devis | Génération d'un devis | Documenté | Très élevée |
| Contrat | Modèle de contrat, acceptation et signature si configurée | Documenté | Élevée |
| Paiement | Statuts et architecture prévue pour plusieurs PSP | Documenté | Très élevée |
| Agenda | Jour / semaine / mois, réservations, demandes et indisponibilités | Documenté | Très élevée |
| Disponibilité | Horaires récurrents, exceptions, préparation et déplacement | Documenté | Très élevée |
| Espace pro | Rendez-vous, demandes, réservations, paiements, agenda, prestations, clients, devis, contrats, paramètres | Documenté | Très élevée |
| Lien public | URL personnelle de réservation | Documenté | Très élevée |
| Widget | Concept de réservation intégrable dans un site externe | Concept/documenté | Élevée |
| Espace client | Réservations à venir/passées, documents, statuts et actions | Documenté | Élevée |
| Notifications | Confirmation et rappels configurables | Documenté | Élevée |
| Modèle générique | Trois modèles : rendez-vous, prestation, demande | Documenté | Très élevée |
| Administration | Utilisateurs, professionnels, catégories, réservations et signalements | Documenté | Élevée |
| LOCAL / Bureau | Dépôt de dossiers, OCR PDF et classement par catégorie | Documenté | Élevée |
| Playlist | Recherche iTunes et extraits de 30 secondes | Documenté | Spécifique événement/musique |

Le README indique explicitement que le produit publié est recentré sur le mariage, tandis que le cahier des charges d'origine visait un système multi-métiers. fileciteturn14file0L2-L2

### Observation

La brique la plus intéressante pour la convergence n'est pas le thème mariage, mais le **moteur générique prestation → disponibilité → demande/réservation → transaction**.

---

## 4. Mission Proof — preuve d'exécution

### Source : `mission-proof-permanent`

| Domaine | Fonction | Preuve | Réutilisabilité potentielle |
|---|---|---|---|
| Mission | Suivi d'une mission physique | Documenté | Élevée |
| Preuve | Preuve d'exécution | Documenté | Très élevée |
| Localisation | Localisation associée à la mission | Documenté | Très élevée |
| Notifications | Notifications liées au suivi | Documenté | Élevée |
| Validation | Validation de l'exécution | Documenté | Très élevée |
| Stockage | Upload de preuves | Documenté | Élevée |
| Authentification | Session et routes protégées | Documenté | Transverse |
| API | API tRPC | Documenté | Technique |
| Persistance | Schéma/migrations MySQL via Drizzle | Documenté | Technique |

Le projet est décrit comme une interface de suivi de missions physiques avec preuve, localisation, notifications et validation. fileciteturn16file0L2-L2

### Potentiel de convergence

Cette brique pourrait devenir un **Proof Layer** transversal : une réservation, prestation, intervention ou mission peut produire des preuves vérifiables sans imposer cette logique à tous les parcours.

---

## 5. OPUS — traitement administratif

### Source : `opus-admin`

La documentation disponible confirme un projet expérimental destiné à repenser un système administratif à partir de documents de formation de la MSA. Le README décrit l'intention mais ne permet pas, à lui seul, de déclarer des fonctionnalités métier précises comme implémentées. fileciteturn17file0L2-L2

| Domaine | Fonction | Preuve | Statut |
|---|---|---|---|
| Documentation | Analyse de documents administratifs | Documenté comme intention | À vérifier |
| Innovation administrative | Repenser le fonctionnement administratif | Concept | À vérifier |
| Transformation documentaire | Passage de documents à un système exploitable | Concept | À vérifier |

### Règle

Aucune fonctionnalité OPUS ne sera intégrée à la Master Architecture avant inspection du code et des données réellement présentes.

---

## 6. WEDDINGCITY

### Source : `WEDDINGCITY`

Le README actuel ne fournit pratiquement aucune documentation fonctionnelle : il contient uniquement des marqueurs de rafraîchissement de production. fileciteturn15file0L2-L7

| Domaine | Fonction | Preuve actuelle dans ce tour | Statut |
|---|---|---|---|
| Produit mariage | Expérience dédiée au mariage | Historique de l'écosystème, mais pas dans README actuel | À vérifier |
| Marketplace | Marketplace événementielle | Historique connu, pas confirmé par README actuel | À vérifier |
| Timeline | Parcours mariage | Historique connu, pas confirmé par README actuel | À vérifier |
| Documents | Intelligence documentaire | Historique connu, pas confirmé par README actuel | À vérifier |
| Graph | Relations entre acteurs | Historique connu, pas confirmé par README actuel | À vérifier |

**Conclusion provisoire :** ne pas réutiliser une fonctionnalité WEDDINGCITY sur la seule base de son historique. Inspection du code requise.

---

## 7. SILLAGE

### Source : `SILLAGE`

Le dépôt n'a pas fourni de README accessible via le chemin attendu lors de cette passe. Les éléments déjà recensés dans PROJECT-ATLAS indiquent un projet autour d'une playlist collaborative de mariage et d'une Timeline musicale, mais ils restent à confirmer directement dans le code.

| Domaine | Fonction | Statut |
|---|---|---|
| Playlist collaborative | Participants pouvant contribuer à une playlist | À vérifier |
| Timeline musicale | Association musique / moments | À vérifier |
| Recherche musicale | Recherche de titres et médias | À vérifier |
| Partage | Collaboration entre participants | À vérifier |
| Mode vertical | Présentation Timeline adaptée au mobile | À vérifier |

---

## 8. AIME-TIMELINE / timeline-theater / tempo-narrative

Ces projets appartiennent à une famille fonctionnelle commune : **Timeline / narration / séquencement**.

La fonction cible à vérifier dans les dépôts est la capacité à représenter un projet comme une succession de moments, états ou événements plutôt que comme une collection de pages indépendantes.

### Hypothèse de convergence

La Timeline pourrait devenir une primitive transversale :

`INTENTION → MOMENTS → ACTIONS → PREUVES → DOCUMENTS → RÉSULTAT`

Cette hypothèse doit être confirmée par inspection des modèles et composants existants.

---

## 9. AIME-COMPOSER — premières briques communes détectées

À ce stade, cinq familles semblent particulièrement transversales :

### A. INTENTION

Entrée en langage naturel ou déclaration structurée du besoin.

### B. ENTITÉ / CARTE

Personne, professionnel, lieu, service, événement, ressource ou organisation.

### C. RELATION / RENCONTRE

Lien entre plusieurs entités selon une intention.

### D. TEMPS / DISPONIBILITÉ

Moments, calendrier, disponibilité, réservation et séquencement.

### E. PREUVE / DOCUMENT

Documents, confirmations, preuves d'exécution, validations et historique.

Ces cinq familles constituent pour l'instant des **candidats à des primitives communes**, pas encore une architecture définitive.

---

## 10. Premières convergences fonctionnelles

| Primitive potentielle | AIME | DISPOO | Mission Proof | OPUS | WEDDINGCITY/SILLAGE |
|---|---:|---:|---:|---:|---:|
| Intention | ✓ | ✓ | ✓ | ? | ? |
| Entité / profil | ✓ | ✓ | ? | ? | ✓ |
| Relation | ✓ | ✓ | ? | ? | ✓ |
| Temps / disponibilité | ✓ | ✓ | ✓ | ? | ✓ |
| Document | ✓ | ✓ | ✓ | ✓? | ✓? |
| Preuve | ? | ? | ✓ | ? | ? |
| Timeline | ✓? | ? | ✓? | ? | ✓ |
| Transaction | ? | ✓ | ? | ? | ✓? |

`?` signifie **à confirmer**, pas absence de fonctionnalité.

---

## 11. Ce que nous ne faisons PAS encore

- Aucun code source n'est fusionné.
- Aucun dépôt existant n'est modifié.
- Aucun classement de "meilleur projet" n'est établi.
- Aucune fonctionnalité n'est déclarée définitive sans preuve suffisante.
- Aucune Master Architecture n'est figée.

---

## 12. Prochaine passe

Inspection directe des fichiers et composants des dépôts prioritaires, notamment :

1. `aime-network`
2. `dispoo`
3. `byaime-one-page`
4. `by-aime`
5. `AIME-TIMELINE`
6. `WEDDINGCITY`
7. `SILLAGE`
8. `timeline-theater`
9. `mission-proof-permanent`
10. `opus-admin`
11. `AIME-ARCHIVE`
12. `aime-desktop`
13. `aime-passport` / `PASSEPORT-AIME`
14. `Aime-Studio`
15. `Aime-Cachet`

La prochaine itération doit remplacer progressivement les hypothèses par des preuves de code, de schéma de données, de routes et de composants.