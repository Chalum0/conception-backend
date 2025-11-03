# Steam API

Node.js/Express backend for user authentication, game catalog management, per-user libraries, and game configuration storage. The service uses PostgreSQL via Prisma for relational data and MongoDB (also via Prisma) for flexible game settings. Swagger UI is exposed at `http://localhost:3000/docs`.

## Tooling Quickstart

- **Zed IDE** (optional editor)
  1. Download the installer for your platform from https://zed.dev.
  2. Install and launch Zed; use `File → Open Folder…` to point at this project. Zed ships with built‑in TypeScript/JavaScript language support so you can get autocompletion and lint hints immediately.
- **Node.js & npm**
  1. Install Node.js 20 or later from https://nodejs.org/en/download/.
  2. Confirm versions after installation:
     ```bash
     node --version
     npm --version
     ```
  3. If you prefer a version manager, both `nvm` and `fnm` work well; just make sure the active Node version is ≥20 before continuing.
- **Docker Compose** (recommended for local PostgreSQL + MongoDB)
  1. Install Docker Desktop from https://www.docker.com/get-started.
  2. All compose files live under `./docker`. Start the database stack from the project root with:
     ```bash
     docker compose -f docker/docker-compose.yml up -d
     ```
  3. Update `.env` if you change the exposed ports or credentials; the defaults map to the compose services.
  4. To stop the stack:
     ```bash
     docker compose -f docker/docker-compose.yml down
     ```

Once these prerequisites are in place, clone the repo and continue with the setup steps below.

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL database (default connection values live in `config/config.js`)
- MongoDB database accessible through `MONGODB_URI`

## Environment Variables

Create a `.env` file in the project root. Common variables:

```ini
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/appdb
MONGODB_URI=mongodb://localhost:27017/appdb
JWT_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

The app falls back to sensible defaults (see `config/config.js`), but providing explicit URLs is recommended.

## Install Dependencies

```bash
npm install
```

## Database Setup

Prisma is used twice: once for PostgreSQL models (`prisma/schema.prisma`) and once for MongoDB game configs (`prisma-mongo/schema.prisma`).

1. Apply relational migrations (PostgreSQL):
   ```bash
   npx prisma migrate dev
   ```

2. Generate the MongoDB Prisma client (no migrations, just generate the client):
   ```bash
   npx prisma generate --schema prisma-mongo/schema.prisma
   ```

Re-run the generate command whenever you alter the Mongo schema.

## Running the Server

```bash
node server.js
```

By default the API listens on `http://localhost:3000`. Swagger UI is available at `http://localhost:3000/docs` and the raw spec at `/docs.json`. Make sure your Docker Compose services from `./docker` are running so PostgreSQL and MongoDB are reachable.

## Testing & Coverage

```bash
npm test
```

Uses Node’s built-in test runner with c8 for coverage. Thresholds are enforced (75% statements/branches/functions/lines). Coverage reports are emitted to `coverage/`.

## Key Endpoints

- `POST /api/auth/register` – create an account (first user becomes admin)
- `POST /api/auth/login` – obtain JWT/refresh tokens
- `GET /api/games` – public catalog
- `POST /api/games` – admin-only game creation
- `PATCH /api/users/:id/role` – admin-only role updates
- Library management (`/api/users/:id/games[...]`) with JWT required
  - Non-admins manage their own library; admins can specify any user
- Game configuration settings (`/api/users/:id/games/:gameId/config`) stored in MongoDB
  - Users can upsert their own settings; admins have read-only access

Full request/response schemas live in Swagger.

## Project Structure

- `controllers/` – Express handlers
- `services/` – Business logic with dependency injection for tests
- `repositories/` – Prisma accessors (PostgreSQL + MongoDB)
- `middlewares/` – Authentication/authorization helpers
- `tests/` – Node test suites covering services, controllers, middleware, and spec validation
