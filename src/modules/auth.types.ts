export type AuthRole =
  | "USER"
  | "ORGANIZER"
  | "EXHIBITOR"
  | "SPEAKER"
  | "ATTENDEE"
  | "SUPER_ADMIN"
  | "SUB_ADMIN"
  | "VENUE_MANAGER";

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
  /** Computed from role + profile fields (see getDisplayName). */
  displayName?: string;
}

