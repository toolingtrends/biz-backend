"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../config/prisma"));
const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-jwt-refresh-secret";
const ACCESS_TOKEN_TTL_SECONDS = 60 * 15; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
function mapUserRoleToAuthRole(role) {
    switch (role) {
        case "ORGANIZER":
            return "ORGANIZER";
        case "EXHIBITOR":
            return "EXHIBITOR";
        case "SUPER_ADMIN":
            return "SUPER_ADMIN";
        case "SUB_ADMIN":
            return "SUB_ADMIN";
        default:
            return "USER";
    }
}
function isAdminRole(role) {
    return role === "SUPER_ADMIN" || role === "SUB_ADMIN";
}
class AuthService {
    static async authenticateWithCredentials(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        // 1. Try SuperAdmin
        const superAdmin = await prisma_1.default.superAdmin.findUnique({
            where: { email: normalizedEmail },
        });
        if (superAdmin) {
            const valid = await bcryptjs_1.default.compare(password, superAdmin.password);
            if (!valid) {
                return null;
            }
            const payload = {
                sub: superAdmin.id,
                email: superAdmin.email,
                role: "SUPER_ADMIN",
                domain: "ADMIN",
                permissions: superAdmin.permissions ?? [],
                firstName: superAdmin.name,
            };
            const tokens = AuthService.issueTokens(payload);
            return { user: payload, tokens };
        }
        // 2. Try SubAdmin
        const subAdmin = await prisma_1.default.subAdmin.findUnique({
            where: { email: normalizedEmail },
        });
        if (subAdmin) {
            const valid = await bcryptjs_1.default.compare(password, subAdmin.password);
            if (!valid) {
                return null;
            }
            const payload = {
                sub: subAdmin.id,
                email: subAdmin.email,
                role: "SUB_ADMIN",
                domain: "ADMIN",
                permissions: subAdmin.permissions ?? [],
                firstName: subAdmin.name,
            };
            const tokens = AuthService.issueTokens(payload);
            return { user: payload, tokens };
        }
        // 3. Fallback to regular User
        const user = await prisma_1.default.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user) {
            return null;
        }
        const validUserPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validUserPassword) {
            return null;
        }
        const role = mapUserRoleToAuthRole(user.role);
        const payload = {
            sub: user.id,
            email: user.email ?? normalizedEmail,
            role,
            domain: "USER",
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar ?? undefined,
        };
        const tokens = AuthService.issueTokens(payload);
        return { user: payload, tokens };
    }
    static issueTokens(payload) {
        const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
            expiresIn: ACCESS_TOKEN_TTL_SECONDS,
        });
        const refreshToken = jsonwebtoken_1.default.sign({
            sub: payload.sub,
            email: payload.email,
            role: payload.role,
            domain: payload.domain,
        }, JWT_REFRESH_SECRET, {
            expiresIn: REFRESH_TOKEN_TTL_SECONDS,
        });
        return { accessToken, refreshToken };
    }
    static verifyAccessToken(token) {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    static verifyRefreshToken(token) {
        return jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
    }
    static async refreshTokens(refreshToken) {
        const decoded = AuthService.verifyRefreshToken(refreshToken);
        // Re-hydrate from DB to ensure account is still valid and get latest permissions
        if (decoded.domain === "ADMIN") {
            const admin = (await prisma_1.default.superAdmin.findUnique({ where: { id: decoded.sub } })) ??
                (await prisma_1.default.subAdmin.findUnique({ where: { id: decoded.sub } }));
            if (!admin) {
                throw new Error("Admin not found");
            }
            const isSuper = "role" in admin && admin.role === "SUPER_ADMIN";
            const role = isSuper ? "SUPER_ADMIN" : "SUB_ADMIN";
            const domain = "ADMIN";
            const payload = {
                sub: admin.id,
                email: admin.email,
                role,
                domain,
                permissions: admin.permissions ?? [],
                firstName: admin.name,
            };
            return AuthService.issueTokens(payload);
        }
        // Regular user
        const user = await prisma_1.default.user.findUnique({ where: { id: decoded.sub } });
        if (!user) {
            throw new Error("User not found");
        }
        const role = mapUserRoleToAuthRole(user.role);
        const payload = {
            sub: user.id,
            email: user.email ?? decoded.email,
            role,
            domain: "USER",
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar ?? undefined,
        };
        return AuthService.issueTokens(payload);
    }
}
exports.AuthService = AuthService;
