"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = requireUser;
exports.requireAdmin = requireAdmin;
exports.requireSuperAdmin = requireSuperAdmin;
const auth_service_1 = require("../services/auth.service");
function extractTokenFromHeader(req) {
    const header = req.headers.authorization;
    if (!header)
        return null;
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token)
        return null;
    return token;
}
function requireUser(req, res, next) {
    try {
        const token = extractTokenFromHeader(req);
        if (!token) {
            return res.status(401).json({ message: "Authorization token missing" });
        }
        const payload = auth_service_1.AuthService.verifyAccessToken(token);
        req.auth = payload;
        return next();
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Auth error (requireUser):", err);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
function requireAdmin(req, res, next) {
    try {
        const token = extractTokenFromHeader(req);
        if (!token) {
            return res.status(401).json({ message: "Authorization token missing" });
        }
        const payload = auth_service_1.AuthService.verifyAccessToken(token);
        if (payload.domain !== "ADMIN") {
            return res.status(403).json({ message: "Admin access required" });
        }
        if (payload.role !== "SUPER_ADMIN" && payload.role !== "SUB_ADMIN") {
            return res.status(403).json({ message: "Admin role required" });
        }
        req.auth = payload;
        return next();
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Auth error (requireAdmin):", err);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
function requireSuperAdmin(req, res, next) {
    try {
        const token = extractTokenFromHeader(req);
        if (!token) {
            return res.status(401).json({ message: "Authorization token missing" });
        }
        const payload = auth_service_1.AuthService.verifyAccessToken(token);
        if (payload.domain !== "ADMIN" || payload.role !== "SUPER_ADMIN") {
            return res.status(403).json({ message: "Super admin access required" });
        }
        req.auth = payload;
        return next();
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Auth error (requireSuperAdmin):", err);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
