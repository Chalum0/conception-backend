import dotenv from "dotenv";

dotenv.config();

export const appConfig = {
  port: Number.parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
};

const postgresHost = process.env.POSTGRES_HOST ?? "dbs.homelab.chalumoid.fr";
const postgresPort = Number.parseInt(process.env.POSTGRES_PORT ?? "5432", 10);
const postgresUser = process.env.POSTGRES_USER ?? "postgres";
const postgresPassword = process.env.POSTGRES_PASSWORD ?? "postgres";
const postgresDb = process.env.POSTGRES_DB ?? "appdb";

export const postgresConfig = {
  host: postgresHost,
  port: postgresPort,
  user: postgresUser,
  password: postgresPassword,
  database: postgresDb,
  url:
    process.env.DATABASE_URL ??
    `postgresql://${postgresUser}:${postgresPassword}@${postgresHost}:${postgresPort}/${postgresDb}`,
};

const mongoHost = process.env.MONGODB_HOST ?? "dbs.homelab.chalumoid.fr";
const mongoPort = Number.parseInt(process.env.MONGODB_PORT ?? "27017", 10);
const mongoDb = process.env.MONGODB_DB ?? "appdb";

export const mongoConfig = {
  host: mongoHost,
  port: mongoPort,
  database: mongoDb,
  url:
    process.env.MONGODB_URI ??
    `mongodb://${mongoHost}:${mongoPort}/${mongoDb}`,
};

export const authConfig = {
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? "change-me-too",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
};
