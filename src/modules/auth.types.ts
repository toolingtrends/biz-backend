export type AuthRole = "USER" | "ORGANIZER" | "EXHIBITOR" | "SUPER_ADMIN" | "SUB_ADMIN";

export type AuthDomain = "USER" | "ADMIN";

export interface AuthTokenPayload {
  sub: string; // underlying Prisma id
  email: string;
  role: AuthRole;
  domain: AuthDomain;
  permissions?: string[];
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

