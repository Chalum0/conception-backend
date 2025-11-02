import dotenv from "dotenv";

dotenv.config();

export const appConfig = {
  port: Number.parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
};

export const postgresConfig = {
  url:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@dbs.homelab.chalumoid.fr:5432/appdb",
};

export const mongoConfig = {
  url:
    process.env.MONGODB_URI ??
    "mongodb://dbs.homelab.chalumoid.fr:27017/appdb",
};

export const authConfig = {
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? "change-me-too",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
};
