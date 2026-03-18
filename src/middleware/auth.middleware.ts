import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { AuthTokenPayload } from "../modules/auth.types";
import prisma from "../config/prisma";

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

/** Allow either JWT or X-Internal-Secret (for Next.js server-to-backend calls). */
export function requireUserOrInternal(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.INTERNAL_API_SECRET;
  const provided = req.headers["x-internal-secret"];
  if (secret && provided === secret) {
    req.auth = { sub: "internal", email: "internal@server", role: "USER", domain: "USER" } as AuthTokenPayload;
    return next();
  }
  return requireUser(req, res, next);
}

/** If a valid JWT is present, set req.auth; otherwise continue without it (no 401). Use for routes that support both anonymous and logged-in users. */
export function optionalUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req);
    if (!token) return next();

    const payload = AuthService.verifyAccessToken(token);
    req.auth = payload;

    const userId = payload.sub;
    if (userId && userId !== "internal") {
      prisma.user.updateMany({ where: { id: userId }, data: { lastLogin: new Date() } }).catch(() => {});
    }
    return next();
  } catch {
    return next();
  }
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const payload = AuthService.verifyAccessToken(token);
    req.auth = payload;

    // Update lastLogin for presence (green dot); fire-and-forget to avoid blocking
    const userId = payload.sub;
    if (userId && userId !== "internal") {
      prisma.user.updateMany({ where: { id: userId }, data: { lastLogin: new Date() } }).catch(() => {});
    }

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

/**
 * Use after requireAdmin. SUPER_ADMIN bypasses; SUB_ADMIN must have the permission in token.permissions.
 */
export function requirePermission(permissionName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ message: "Authorization required" });
    }
    if (req.auth.role === "SUPER_ADMIN") {
      return next();
    }
    const permissions: string[] = req.auth.permissions ?? [];
    if (permissions.includes(permissionName)) {
      return next();
    }
    return res.status(403).json({
      message: "Insufficient permissions",
      required: permissionName,
    });
  };
}

