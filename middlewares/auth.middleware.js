import { verifyAccessToken } from "../utils/jwt.js";

const ADMIN_ROLE = "ADMIN";

const defaultDependencies = {
  verifyAccessToken,
};

let dependencies = { ...defaultDependencies };

export const __setDependencies = (overrides = {}) => {
  dependencies = { ...defaultDependencies, ...overrides };
};

export const __resetDependencies = () => {
  dependencies = { ...defaultDependencies };
};

export const authenticateAccessToken = (req, res, next) => {
  const authorization = req.headers?.authorization ?? req.headers?.Authorization;

  if (!authorization || typeof authorization !== "string") {
    return res
      .status(401)
      .json({ message: "Authorization header missing." });
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ message: "Authorization header malformed." });
  }

  try {
    const payload = dependencies.verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch (error) {
    console.error("authenticateAccessToken error:", error);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== ADMIN_ROLE) {
    return res.status(403).json({ message: "Admin access required." });
  }

  return next();
};
