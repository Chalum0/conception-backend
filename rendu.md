# Rendu – BC02

- Étudiant&nbsp;: << Nom Prénom étudiant >>
- Module&nbsp;: BC02 – Concevoir et réaliser des applications et des services Back-end sur des architectures serveur complexes
- Projet support&nbsp;: API Node.js/Express avec PostgreSQL (Prisma) et MongoDB (Prisma Mongo) – répertoire `projet-python`

## C7 · Configurer et personnaliser l’environnement de développement

### Cr7.1 – Exactitude de l’installation
- Stack installée sur Node.js 20+ avec `npm install` pour toutes les dépendances définies dans `package.json` (`dependencies`/`devDependencies`). La configuration Postgres/Mongo est centralisée dans `config/config.js:5-42`.
- Prisma est initialisé côté SQL via `npx prisma migrate dev` et côté Mongo via `npx prisma generate --schema prisma-mongo/schema.prisma` comme décrit dans `README.md:33-55`.
- Les variables sensibles sont injectées via `.env`, avec repli sûr documenté (`config/config.js:44-48`) garantissant un service fonctionnel et reproductible.

### Cr7.2 – Utilisation du terminal
- Les tâches clefs se pilotent en CLI : `npm test` pour l’intégration/vitest (`README.md:69-74`), `node server.js` pour le run local (`README.md:57-63`), et les scripts Prisma mentionnés ci-dessus pour la gestion des schémas.
- Les commandes Docker de provisioning (Postgres/Mongo) sont fournies et adaptées à l’environnement de production ciblé (`README.md:17-31`), assurant une parité dev/prod.
- Des scripts utilitaires complètent l’usage du terminal, dont `scripts/backup.py` pour l’archivage et la sauvegarde (`scripts/backup.py:1-124`).

### Cr7.3 – Personnalisation de l’IDE
- Le projet recommande Zed (ou équivalent VS Code) avec support TS/JS natif pour l’autocomplétion, la coloration Prisma et le formatage (`README.md:7-15`).
- Les conventions (modules ECMAScript, Prisma, tests Node) sont alignées avec des extensions courantes : ESLint/Prettier (prévu), Prisma, REST Client. Le mapping dossiers (`controllers/`, `services/`, `repositories/`, `tests/`) permet une navigation IDE efficace grâce aux favoris et aux recherches contextuelles.
- Les snippets personnels incluent l’initialisation de modules Express et de repositories Prisma, évitant le boilerplate répétitif (ex. modèle standardisé dans `models/user.model.js:3-8`).

## C8 · Élaborer et implémenter des solutions Back-end

### Cr8.1 – Qualité de la conception POO
- Le service applique l’encapsulation via des modules à dépendances injectables (`services/user.service.js:1-113`), séparant la logique métier et permettant le mocking exhaustif côté tests.
- Les différents rôles et responsabilités (utilisateur/admin) sont exprimés via constantes (`USER_ROLE`, `ADMIN_ROLE`) et contrôles dédiés, assurant un polymorphisme fonctionnel dans les contrôleurs (`controllers/user.controller.js:1-146`).

### Cr8.2 – Utilisation de l’architecture MVC
- Routes Express (`routers/user.router.js:1-74`, `routers/game.router.js:1-63`) délèguent aux contrôleurs (`controllers/*.js`) qui oriente la logique vers les services (`services/*.js`) et repositories (`repositories/*.js`), respectant la séparation MVC (Vue remplacée par Swagger/OpenAPI pour l’exposition).
- Les modèles Prisma (`models/*.js`) encapsulent l’accès aux entités SQL/Mongo, fournissant la couche M. Les tests orchestrent les contrôleurs/services isolément (`tests/*.test.js`).

### Cr8.3 – Clarté du code
- Nommage explicite, commentaires ciblés (ex. justification du délégué Prisma dans `models/user.model.js:3-7`) et conventions d’import homogènes facilitent la lecture.
- Les tests `node:test` couvrent chaque service et middleware (ex. `tests/user.service.test.js:1-190`, `tests/auth.middleware.test.js:1-142`), servant de documentation comportementale et prouvant la maintenabilité.
- L’OpenAPI (`docs/openapi.json`) centralise les contrats d’API, réduisant les ambiguïtés et favorisant la compréhension pour les nouveaux développeurs.

## C9 · Optimiser et sécuriser les serveurs web

### Cr9.1 – Gestion des ressources
- `config/prisma.js:1-8` instancie un PrismaClient unique avec pool géré, évitant la surconsommation de connexions Postgres.
- Les configurations de ports/URL sont paramétrables (`config/config.js:5-42`), permettant d’ajuster l’application aux contraintes CPU/mémoire via le déploiement (PM2, conteneurisation).
- Des endpoints de supervision (`server.js:23-25`) et la structuration stateless facilitent la scalabilité horizontale et la mise sous monitoring externe (ex. probes Kubernetes).

### Cr9.2 – Mise en place de la sécurité
- L’API est sécurisée par JWT (cf. `utils/jwt.js:1-10`, `middlewares/auth.middleware.js:19-56`), mais la terminaison TLS (certificats SSL) reste à réaliser côté reverse-proxy/infra. Plan suivant : intégrer un serveur HTTPS ou s’appuyer sur Nginx + Let’s Encrypt en production.
- L’accès SSH n’est pas couvert dans ce dépôt applicatif ; il sera géré par l’équipe infra avec bastion et clés tournantes.

## C10 · Bases de données relationnelles

### Cr10.1 – Conformité du schéma
- Le schéma Postgres (`prisma/schema.prisma:10-58`) couvre utilisateurs, jetons de rafraîchissement, jeux et bibliothèques, répondant aux besoins fonctionnels (authentification, catalogue, bibliothèque par utilisateur).
- Contraintes métiers assurées : unicité email (`@unique`), liaison user↔token, user↔game (bibliothèque).

### Cr10.2 – Normalisation
- La normalisation 3FN est respectée : séparation RefreshToken, Game et UserGame, lien `@@unique([userId, gameId])` pour éviter doublons (`prisma/schema.prisma:49-58`).
- Les migrations Prisma héritent de ces règles et garantissent l’intégrité référentielle (`@relation(... onDelete: Cascade)`).

### Cr10.3 – Performance et sécurité
- Les champs sensibles (mots de passe) sont stockés hachés (`services/user.service.js:47-109`) et les tokens rafraîchissement sont hachés avant stockage (`utils/token.js:4-11`).
- Les tests de charge ne sont pas encore automatisés, mais Prisma offre la préparation de requêtes et la configuration de pool ajustable. Étape prévue : ajouter des index dérivés (ex. `Game.title`) en fonction des métriques réelles.

## C11 · Bases de données NoSQL

### Cr11.1 – Adéquation de l’architecture NoSQL
- `prisma-mongo/schema.prisma:11-21` définit `GameConfig` pour stocker des paramètres utilisateur/jeu en JSON, cas typique de données semi-structurées nécessitant flexibilité.
- L’intégration via `repositories/game-config.repository.js:1-68` permet un CRUD complet et atomique (upsert) adapté aux fortes volumétries de configurations.

### Cr11.2 – Optimisation
- L’unicité composite `@@unique([userId, gameId])` autorise les upserts ciblés, réduisant les collisions et facilitant la réplication.
- Les requêtes sont triées par `updatedAt` (`listGameConfigsByUser`), optimisant les lectures fréquentes et préparant la mise à l’échelle (partitionnement par `userId` envisageable).

## C12 · Arbitrer entre bases relationnelles et NoSQL

### Cr12.1 – Prise de décision
- PostgreSQL est retenu pour les données transactionnelles (utilisateurs, bibliothèque) nécessitant ACID et relations fortes (`prisma/schema.prisma:10-58`).
- MongoDB gère les configurations dynamiques, favorisant la rapidité d’évolution et l’évolutivité horizontale (`prisma-mongo/schema.prisma:11-21`). Ce choix équilibre coûts (licences open source), performance (requêtes JSON rapides) et élasticité (replica sets Mongo), en cohérence avec les critères établis.

## C13 · Stratégies de sauvegarde et de récupération

### Cr13.1 – Rigueur du plan de sauvegarde
- Le script `scripts/backup.py:1-124` automatise des archives horodatées pour tout dossier critique (schema Prisma, config, docs), permettant des snapshots réguliers et traçables.
- Les bases de données sont couvertes par des dumps automatisables (Docker `pg_dump`, `mongodump`) intégrables dans la même planification.

### Cr13.2 – Alignement avec les politiques de sécurité
- Les sauvegardes générées peuvent être stockées dans un dépôt chiffré/serveur S3 avec gestion IAM. Le script accepte un répertoire dédié (`--dest`) pour respecter l’isolement des sauvegardes.
- Les secrets restent externalisés (.env non commité) ce qui simplifie la rotation post-restauration. Prochaine étape : ajouter le chiffrement côté client (GPG) pour respecter les politiques de l’entreprise.

---

## Commentaires
- Priorités à court terme : ajout d’un reverse proxy HTTPS, instrumentation (metrics) et automatisation des tests de performance.
- Les stratégies de réplication (Postgres/Mongo) et la rotation des clefs JWT feront l’objet d’un ticket infra dédié.

## Signatures
- Correcteur 1 : ……………………
- Correcteur 2 : ……………………
