# Rendu BC02

- Etudiant : << Nom Prénom étudiant >>
- Module : BC02 – Concevoir et réaliser des applis et services back-end
- Projet : API Node.js/Express avec PostgreSQL + MongoDB (Prisma) – dossier `projet-python`

## C7 · Configurer et personnaliser l’environnement

### Cr7.1 – Installation correcte
- Node.js 20+, `npm install` et toutes les deps de `package.json` marchent (`config/config.js:5-42` pour les URLs par défaut).
- Prisma SQL avec `npx prisma migrate dev`, Prisma Mongo avec `npx prisma generate --schema prisma-mongo/schema.prisma` comme noté dans `README.md:33-55`.
- `.env` gère les secrets mais il y a des valeurs fallback (`config/config.js:44-48`) donc le projet démarre même si on oublie un champ.

### Cr7.2 – Terminal
- Commandes régulières : `npm test` pour la suite de tests (`README.md:69-74`), `node server.js` pour lancer (`README.md:57-63`), Prisma CLI pour mettre à jour les schémas.
- Docker prêt pour Postgres/Mongo (`README.md:17-31`). Ça ressemble à la prod qu’on vise.
- Script `scripts/backup.py` pour faire des archives vite fait (`scripts/backup.py:1-124`).

### Cr7.3 – IDE perso
- J’utilise Zed ou VS Code avec autocomplétion JS/TS comme conseillé (`README.md:7-15`).
- Le découpage (`controllers/`, `services/`, `repositories/`, `tests/`) rend la navigation rapide. Le modèle Prisma est exposé dans `models/user.model.js:3-8`.
- Plugins prévus (ESLint/Prettier, Prisma) mais pas tous installés encore. L’IDE reste custom avec quelques snippets maison.

## C8 · Implémenter la solution back-end

### Cr8.1 – Conception orientée objet
- Les services injectent leurs dépendances (`services/user.service.js:1-113`), donc la logique reste encapsulée et on peut tout mocker dans les tests.
- Rôles USER/ADMIN définis par constantes et contrôlés dans les controllers (`controllers/user.controller.js:1-146`). Pas de classe mais on respecte l’idée POO.

### Cr8.2 – Architecture MVC
- Routes Express (`routers/user.router.js:1-74`, `routers/game.router.js:1-63`) appellent des contrôleurs → services → repositories. La vue est remplacée par Swagger.
- Modèles Prisma (`models/*.js`) fournissent la couche M, tests `tests/*.test.js` valident chaque brique.

### Cr8.3 – Clarté du code
- Noms clairs, imports cohérents, juste quelques commentaires utiles (ex. `models/user.model.js:3-7`). On comprend vite.
- Tests `node:test` couvrent services/middleware (`tests/user.service.test.js:1-190`, `tests/auth.middleware.test.js:1-142`), donc refacto safe.
- OpenAPI (`docs/openapi.json`) garde les contrats d’API lisibles pour tout le monde.

## C9 · Optimiser et sécuriser les serveurs web

### Cr9.1 – Gestion des ressources
- `config/prisma.js:1-8` crée un seul PrismaClient, évite de spammer la DB.
- Ports/URLs configurables (`config/config.js:5-42`), pratique pour scaler avec PM2 ou docker.
- Endpoint `/health` (`server.js:23-25`) pour la supervision. L’app est stateless donc facile à load-balancer.

### Cr9.2 – Sécurité
- Auth via JWT (`utils/jwt.js:1-10`, `middlewares/auth.middleware.js:19-56`). Pas encore de HTTPS intégré, faudra un reverse proxy style Nginx + Let’s Encrypt.
- SSH/SSL côté infra, pas dans ce repo. On note juste que c’est à prévoir.

## C10 · Bases de données relationnelles

### Cr10.1 – Schéma conforme
- Schéma SQL (`prisma/schema.prisma:10-58`) couvre users, refresh tokens, games, user_game. C’est ce qu’il faut pour auth + catalogue + bibliothèque.
- Contraintes : email unique, relations en cascade, etc. Tout est décrit dans Prisma.

### Cr10.2 – Normalisation
- Tables séparées pour éviter redondance (`prisma/schema.prisma:49-58`). On respecte la 3FN.
- Les relations `onDelete: Cascade` gardent l’intégrité si on supprime un user ou un jeu.

### Cr10.3 – Performance & sécurité
- Mots de passe hashés (`services/user.service.js:47-109`), refresh tokens hashés (`utils/token.js:4-11`).
- Pas encore de benchs perf mais Prisma permet d’ajuster le pool ou ajouter des index (prévu sur `Game.title` si nécessaire).

## C11 · Bases de données NoSQL

### Cr11.1 – Architecture adaptée
- `prisma-mongo/schema.prisma:11-21` définit `GameConfig` pour stocker les settings JSON par user/jeu.
- Repos Mongo (`repositories/game-config.repository.js:1-68`) gèrent upsert/find/list/delete. Ça scale bien pour beaucoup de configs.

### Cr11.2 – Optimisation
- `@@unique([userId, gameId])` évite les doublons et rend l’upsert easy.
- Listing trié par `updatedAt`, aide pour récupérer la dernière config et préparé pour sharder sur `userId` si un jour on doit.

## C12 · Choisir entre SQL et NoSQL

### Cr12.1 – Décision
- PostgreSQL pour les données critiques et relationnelles (`prisma/schema.prisma:10-58`) parce qu’on veut ACID et cohérence forte.
- MongoDB pour les configs modulables (`prisma-mongo/schema.prisma:11-21`), coûts raisonnables et évolutivité rapide. Mix validé sur les critères perf/coût/flex.

## C13 · Sauvegarde et récupération

### Cr13.1 – Plan de backup
- `scripts/backup.py:1-124` crée des archives horodatées pour les dossiers sensibles (config, docs, schemas). Facile à automatiser en cron.
- Prévoit aussi d’utiliser `pg_dump` et `mongodump` pour les bases, histoire de tout restaurer si crash.

### Cr13.2 – Politique sécurité
- Archives stockées dans un dossier sécurisé ou S3 avec IAM. L’argument `--dest` permet de choisir (`scripts/backup.py:36-54`).
- `.env` reste hors repo, donc rotation des secrets simple après une restau. Prochaine étape envisagée : chiffrer les backups (GPG) pour suivre les règles sécurité.

---

## Commentaires
- Prochaines tâches : mettre un proxy HTTPS, ajouter un peu de métriques monitoring, lancer des tests de perf simples.
- A faire aussi : plan de réplication Postgres/Mongo et rotation auto des clés JWT (pas encore démarré).

## Signatures
- Correcteur 1 : ……………………
- Correcteur 2 : ……………………
