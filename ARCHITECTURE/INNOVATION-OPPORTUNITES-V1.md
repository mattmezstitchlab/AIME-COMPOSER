# INNOVATION-OPPORTUNITES-V1

Relevé d'opportunités — fonctions qui manquent partout et que presque tout le monde utilise mal ou n'a pas. Chaque proposition est ancrée dans ce qui est DÉJÀ mesuré dans ce dépôt (médiathèque transversale, couverture nommée, doublons par empreinte, briefs agents, mode local) : rien n'est un effet d'annonce, chaque idée part d'un constat chiffré.

Statut : liste d'opportunités, pas un engagement. Un passage en réalisation suit la règle — proposition, validation humaine, diagnostic.

## Constat de départ (mesuré le 17 septembre 2026)

- 38 dépôts parcourus en entier · 366 médias · **119 doublons de contenu** (mêmes octets, chemins différents) · **0 fichier audio commité** alors que des systèmes audio/vidéo existent — ils vivent hors git, invisibles à la plupart des outils.
- La couverture d'un scan est presque toujours implicite ; ici elle est publiée ligne par ligne. Presque aucun outil ne dit *ce qu'il n'a pas vu*.
- Les médias se déplacent humain → agent → projet par copier-coller d'URL au kilomètre ; il n'existe pas de format d'échange sobre pour « transmettre des fichiers à un agent ».

## P1 — Les quatre grandes pièces manquantes

### 1. L'atlas canonique par contenu (dédup universelle)

Même fichier, cinq chemins, trois dépôts, deux appareils : personne ne dit « c'est le même ». Nous avons la brique (empreinte sha git, 119 doublons mesurés). Étape suivante : une **entité canonique** par contenu, des projections vers chaque emplacement, et une *proposition de fusion* que l'humain valide — jamais une suppression silencieuse. Puis empreinte perceptuelle (images similaires, pas seulement identiques) calculée localement. Aucun outil grand public (Drive, Photos, GitHub, Dropbox) ne fait le canonique inter-dépôts/inter-appareils avec validation.

### 2. Le contrat de couverture universel

Un scan qui ne dit pas ce qu'il a couvert est une opinion. Généraliser la table « Couverture du scan » de la médiathèque : pour tout inventaire (médias, écrans, endpoints, personnes), un **objet de couverture vérifiable** — total, éléments nommés, états (ok/vide/erreur/tronqué), date, mode de preuve. C'est la différence entre « j'ai cherché » et « voici le périmètre, vérifiez ». Ne existe nulle part comme artefact standard ; c'est aussi exactement ce dont un agent a besoin pour ne pas halluciner un fichier.

### 3. Le brief agent, format d'échange

La médiathèque transmet déjà (liens, brief + manifeste JSON, script). En faire un petit **format d'interopérabilité** : `brief.json` versionné (objets, provenance, règles de conduite, clause « demander les fichiers manuels »), lisible par n'importe quel agent ou humain. Aujourd'hui chacun bricole des prompts ; demain le brief suit la pièce, de la médiathèque au projet, avec journal des transferts (RGPD : traçabilité des copies). Le « copier-coller vers l'agent » comme protocole — personne ne l'a formalisé.

### 4. Le graphe d'usage inversé des fichiers

Question que tout le monde se pose et que rien ne répond : **« qui utilise ce fichier, où ?»** — quel repo, quel écran, quelle URL, quel document. Construire l'index inversé fichier → usages (références dans les arbres git, manifests, CSS, pages). Résultat : une **analyse d'impact avant remplacement** (« cette image est référencée 4 fois dont 1 en prod ») — la sérénité avant chaque nettoyage, inexistante aujourd'hui.

## P2 — Suites naturelles déjà amorcées

5. **Visionneuse hors-git** : lire les stockages applicatifs (buckets Supabase, registres médias des apps, ex. `site-media`) via leurs manifests en lecture seule — l'angle mort audio prouvé au constat ci-dessus devient une première intégration concrète. Mêmes règles : référence, jamais copie.
6. **Delta local (machine à voyager dans une surface d'entrée)** : relire un dossier déjà choisi et présenter ce qui a changé depuis la dernière lecture (ajouts, renommages probables par empreinte), sans jamais synchroniser. La règle du Bureau « surface d'entrée » devient une capacité de suivi, pas un silo figé.
7. **Écoute indexable** : transcription locale à la demande des pistes audio/vidéo de la médiathèque pour retrouver un média « à ce qui s'y dit » — proposition automatique, validation humaine avant toute indexation durable.
8. **Mémoire de décision média** : relier chaque choix d'asset au journal NOEMA (« pourquoi cette couverture le 12 mars ») — la timeline devient explicative du design réel.

## Règles permanentes (toutes ces pièces)

- Mesurer avant de promettre ; publier la couverture, pas la confiance.
- Originaux et provenance préservés ; aucune copie, aucune sync sans validation humaine.
- Chaque export est un contrat vérifiable, chaque absence un constat nommé.
- Un écran innovant passe Design QA comme les 32 autres — l'innovation n'exempte du système pour personne.
