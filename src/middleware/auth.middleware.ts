import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { AuthTokenPayload } from "../modules/auth.types";

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthTokenPayload;
  }
}

function extractTokenFromHeader(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const payload = AuthService.verifyAccessToken(token);
    req.auth = payload;

    return next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Auth error (requireUser):", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const payload = AuthService.verifyAccessToken(token);

    if (payload.domain !== "ADMIN") {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (payload.role !== "SUPER_ADMIN" && payload.role !== "SUB_ADMIN") {
      return res.status(403).json({ message: "Admin role required" });
    }

    req.auth = payload;
    return next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Auth error (requireAdmin):", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const payload = AuthService.verifyAccessToken(token);

    if (payload.domain !== "ADMIN" || payload.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Super admin access required" });
    }

    req.auth = payload;
    return next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Auth error (requireSuperAdmin):", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

