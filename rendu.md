# Rendu BC02
- 
- Module : BC02 – Concevoir et réaliser des applis et services back-end
- Projet : API Node.js/Express avec PostgreSQL + MongoDB (Prisma) – dossier `projet-python`

## Configuration de l’environnement (Cr7)

Voir readme

## Conception et implémentation Back-End (Cr8)

### Cr8.1 — Qualité de la conception POO
- Les services gèrent la logique métier et isolent les dépendances (ex. `services/user.service.js:1-190`), ce qui protège les données et facilite les mocks.
- Constantes `ADMIN_ROLE`/`USER_ROLE` partagées pour éviter les strings magiques, injection dans les contrôleurs (`controllers/user.controller.js:1-146`).
- On n’a pas de classes partout mais la séparation responsabilités est respecté : service traite, repository parle à la base.

### Cr8.2 — Utilisation de l’architecture MVC
- Routes Express (`routers/user.router.js:1-74`, `routers/game.router.js:1-63`) → contrôleurs → services → repositories. Pas de vue graphique, la doc Swagger remplace cette couche.
- Les modèles Prisma (`models/*.js`) servent de façade vers la datasource SQL/Mongo; `config/prisma.js` et `config/prisma.mongo.js` injectent les clients.
- Tests unitaires par couche dans `tests/*.test.js`, ce qui prouve que la séparation marche vraiment.

### Cr8.3 — Clarté du code
- Noms de fonctions explicites (`authenticateUser`, `listUserLibrary`…), indentation standard. Quelques commentaires ciblés pour les points tricky (ex. `models/user.model.js:3-7`).
- L’OpenAPI (`docs/openapi.json`) expose toutes les routes donc pas besoin de deviner les payloads.
- Suite de tests node:test + c8 (`tests/user.service.test.js`, `tests/auth.middleware.test.js`) assure qu’on ne casse pas tout en refacto. On garde ce rituel.

## Configuration des serveurs Web (Cr9)

### Cr9.1 — Gestion des ressources
- Un seul PrismaClient SQL est instancié (`config/prisma.js:1-8`), évite de saturer Postgres. Même idée côté Mongo avec un cache (`config/prisma.mongo.js:15-27`).
- Variables d’environnement pilotées via `.env` avec fallback dans `config/config.js:5-42`, donc adaptation facile si on scale via PM2 ou container.
- Endpoint `/health` (`server.js:23-25`) pour check rapide. L’app est stateless donc le load balancing est simple, on peut multiplier les pods si besoin.

### Cr9.2 — Sécurité
- JWT requis sur toutes les routes sensibles (`middlewares/auth.middleware.js:19-56`). Les tokens sont signés avec les secrets du `.env`.
- Pas encore de certificat TLS intégré mais prévu via reverse proxy (nginx/traefik). On documente cette dette technique.
- Les refresh tokens stockés hashés en base (`utils/token.js:4-11` + `services/user.service.js:147-190`), ça limite l’impact si fuite SQL.

## Conception et administration des BD relationnelles (Cr10)

### Cr10.1 — Conformité du schéma
- Schéma Prisma Postgres (`prisma/schema.prisma:10-58`) couvre Users, RefreshToken, Game et UserGame, pile ce qu’il faut pour auth + bibliothèque.
- Contrôles de base : email unique, cascade sur les relations, timestamps auto. Rien d’exotique mais ça répond aux besoins métier.

### Cr10.2 — Normalisation
- Les tables sont en 3FN : User pour l’identité, Game pour le catalogue, UserGame pour la relation n-n, RefreshToken pour la session. Pas de duplication inutile.
- L’unicité `@@unique([userId, gameId])` sur UserGame garde la cohérence et évite les doublons.

### Cr10.3 — Performance et sécurité
- Hash bcrypt sur les mots de passe (`services/user.service.js:47-109`) et requêtes Prisma paramétrées réduisent les injections SQL.
- Possibilité d’ajouter des index Prisma si on détecte un hot spot (ex. sur `Game.title`). Pour l’instant la perf est bonne car dataset modeste.
- Rôles et middlewares côté API protègent les routes admin (`requireAdmin`).

## Conception et administration des BD NoSQL (Cr11)

### Cr11.1 — Adéquation de l’architecture NoSQL
- `prisma-mongo/schema.prisma:11-21` définit `GameConfig` stockant les réglages par couple user/game. JSON libre, parfait pour les options de jeu qui changent souvent.
- Repository dédié (`repositories/game-config.repository.js:1-68`) gère upsert et listing par user. Ça permet d’avoir une réponse rapide pour les clients.

### Cr11.2 — Optimisation
- Index logique via l’unicité composite `@@unique([userId, gameId])`, ce qui rend l’upsert constant et évite les duplications.
- Les listes renvoient les configs triées par `updatedAt` pour servir la dernière version. À terme on envisage shards par `userId` si la volumétrie explose, c’est compatible avec Mongo.

## Arbitrage des solutions (Cr12)

### Cr12.1 — Prise de décision
- PostgreSQL gardé pour les données transactionnelles (users, tokens, bibliothèques) parce qu’on veut de la cohérence ACID et des jointures.
- MongoDB choisi pour les configs dynamiques, car la structure JSON change souvent et on veut déployer vite sans migrations lourdes.
- Les deux bases sont open source, coût licences = 0; la montée en charge se fait vertical côté Postgres et horizontale côté Mongo, donc on a un bon mix pour perf/coût/évolution.

## Stratégies de sauvegarde et récupération (Cr13)

### Cr13.1 — Rigueur du plan de sauvegarde
- Script `scripts/backup.py:1-124` génère des archives datées pour les dossiers critiques (config, docs, schemas). On peut le mettre en cron facilement.
- Pour les bases : `pg_dump` et `mongodump` branchés sur les conteneurs Docker via `docker compose exec`. Pas encore automatisé mais documenté dans nos notes.

### Cr13.2 — Alignement avec la sécurité
- Les backups sont stockés hors repo Git, dans un dossier dédié (ex. `backups/`). On peut ensuite pousser vers un bucket privé S3 chiffré.
- `.env` n’est jamais versionné, donc on régénère proprement les secrets après restauration pour respecter les règles de l’école / entreprise.
- Étape suivante prévue : chiffrer les archives avec gpg côté client pour être conforme RGPD.

