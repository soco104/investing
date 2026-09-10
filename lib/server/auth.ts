import { NextResponse } from "next/server";

import {
  createSession,
  findActiveSession,
  findUserById,
  findUserByPassword,
  hasProductionDatabase,
  revokeSession,
} from "./repository";
import { hashToken, verifyPassword } from "./crypto";

export type AuthRole = "Student" | "Teacher" | "Admin";

export type PermissionKey =
  | "studentProfile"
  | "teacherPortal"
  | "adminPortal"
  | "questImportExport"
  | "portfolioCorrections";

export type AuthenticatedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  alias: string;
  role: AuthRole;
  className: string;
  permissions: Record<PermissionKey, boolean>;
};

export type SeedAuthUser = AuthenticatedUser & {
  passwordHash: string;
};

export const seedAuthUsers: SeedAuthUser[] = [
  {
    id: "user-avery",
    email: "avery.johnson@student.lincolnusd.edu",
    firstName: "Avery",
    lastName: "Johnson",
    alias: "ValueVoyager",
    role: "Student",
    className: "7th Grade Finance A",
    passwordHash:
      "d5f83a521580eb51068dd4238cb9abd7c571e1f5f026a6859af398dce85c7c98",
    permissions: {
      studentProfile: true,
      teacherPortal: false,
      adminPortal: false,
      questImportExport: false,
      portfolioCorrections: false,
    },
  },
  {
    id: "user-rivera",
    email: "erivera@lincolnusd.edu",
    firstName: "Elena",
    lastName: "Rivera",
    alias: "MsRivera",
    role: "Teacher",
    className: "7th Grade Finance A",
    passwordHash:
      "35ab81eb7001277104ecd69afa5cd978eaf41aad4eaf3e5053f05e66a2fe6bea",
    permissions: {
      studentProfile: false,
      teacherPortal: true,
      adminPortal: false,
      questImportExport: true,
      portfolioCorrections: false,
    },
  },
  {
    id: "user-admin",
    email: "sgordon@lincolnusd.edu",
    firstName: "Sam",
    lastName: "Gordon",
    alias: "DistrictAdmin",
    role: "Admin",
    className: "District",
    passwordHash:
      "198352b6a8078a827be267c847d39506629d3af446a3cc0bce670dd3a6b5d753",
    permissions: {
      studentProfile: true,
      teacherPortal: true,
      adminPortal: true,
      questImportExport: true,
      portfolioCorrections: true,
    },
  },
];

const sessionCookieName = "futurefund_session";
const defaultSessionSecret = "futurefund-local-development-session-secret";
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export function isDemoAuthAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_AUTH === "true";
}

export function publicUser(user: SeedAuthUser): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    alias: user.alias,
    role: user.role,
    className: user.className,
    permissions: user.permissions,
  };
}

export async function authenticatePassword(email: string, password: string) {
  const throttleKey = email.toLowerCase();

  if (isLoginThrottled(throttleKey)) {
    return null;
  }

  const productionUser = await findUserByPassword(email, password);

  if (productionUser) {
    clearLoginThrottle(throttleKey);
    return productionUser;
  }

  if (!isDemoAuthAllowed()) {
    recordFailedLogin(throttleKey);
    return null;
  }

  const demoUser = seedAuthUsers.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );

  const authenticated =
    demoUser && (await verifyPassword(password, demoUser.passwordHash))
      ? publicUser(demoUser)
      : null;

  if (authenticated) {
    clearLoginThrottle(throttleKey);
  } else {
    recordFailedLogin(throttleKey);
  }

  return authenticated;
}

export async function createSessionToken(user: AuthenticatedUser, request?: Request) {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 8;
  const payload = base64UrlEncode(
    JSON.stringify({
      className: user.className,
      email: user.email,
      exp: expiresAt,
      id: user.id,
      permissions: user.permissions,
      role: user.role,
    })
  );
  const signature = await sign(payload);
  const token = `${payload}.${signature}`;

  await createSession({
    authMethod: "password",
    expiresAt: new Date(expiresAt),
    ipAddress: request?.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
    sessionTokenHash: await hashToken(token),
    userAgent: request?.headers.get("user-agent") ?? null,
    userId: user.id,
  });

  return token;
}

export async function userFromRequest(request: Request) {
  const token = bearerToken(request) ?? cookieToken(request);

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function requirePermission(
  request: Request,
  permission: PermissionKey
) {
  const user = await userFromRequest(request);

  if (!user) {
    return {
      response: NextResponse.json(
        { ok: false, message: "Authentication is required." },
        { status: 401 }
      ),
      user: null,
    };
  }

  if (user.role !== "Admin" && !user.permissions[permission]) {
    return {
      response: NextResponse.json(
        { ok: false, message: "This account is not authorized for that action." },
        { status: 403 }
      ),
      user: null,
    };
  }

  return { response: null, user };
}

export function attachSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function revokeCurrentSession(request: Request) {
  const token = bearerToken(request) ?? cookieToken(request);

  if (!token) {
    return false;
  }

  await revokeSession(await hashToken(token));

  return true;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

function bearerToken(request: Request) {
  const auth = request.headers.get("authorization");

  if (!auth?.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return auth.slice(7).trim();
}

function cookieToken(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${sessionCookieName}=`));

  return match ? decodeURIComponent(match.slice(sessionCookieName.length + 1)) : null;
}

async function verifySessionToken(token: string): Promise<AuthenticatedUser | null> {
  const [payload, signature] = token.split(".");

  if (!payload || !signature || (await sign(payload)) !== signature) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as {
      className: string;
      email: string;
      exp: number;
      id: string;
      permissions: Record<PermissionKey, boolean>;
      role: AuthRole;
    };

    if (!parsed.exp || parsed.exp < Date.now()) {
      return null;
    }

    if (hasProductionDatabase()) {
      const session = await findActiveSession(await hashToken(token));

      if (!session) {
        return null;
      }

      return findUserById(session.user_id);
    }

    if (!isDemoAuthAllowed()) {
      return null;
    }

    const seedUser = seedAuthUsers.find((user) => user.id === parsed.id);

    return {
      alias: seedUser?.alias ?? "",
      className: parsed.className,
      email: parsed.email,
      firstName: seedUser?.firstName ?? "",
      id: parsed.id,
      lastName: seedUser?.lastName ?? "",
      permissions: parsed.permissions,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

function isLoginThrottled(key: string) {
  const attempt = loginAttempts.get(key);

  return Boolean(attempt && attempt.lockedUntil > Date.now());
}

function recordFailedLogin(key: string) {
  const previous = loginAttempts.get(key);
  const count = (previous?.count ?? 0) + 1;
  const lockedUntil =
    count >= 5 ? Date.now() + Math.min(15 * 60 * 1000, count * 60 * 1000) : 0;

  loginAttempts.set(key, { count, lockedUntil });
}

function clearLoginThrottle(key: string) {
  loginAttempts.delete(key);
}

async function sign(payload: string) {
  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required in production.");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.SESSION_SECRET ?? defaultSessionSecret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );

  return base64UrlEncodeBytes(new Uint8Array(signature));
}

function base64UrlEncode(value: string) {
  return base64UrlEncodeBytes(new TextEncoder().encode(value));
}

function base64UrlEncodeBytes(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(value: string) {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`
    .replaceAll("-", "+")
    .replaceAll("_", "/");
  const binary = atob(padded);

  return new TextDecoder().decode(
    Uint8Array.from(binary, (character) => character.charCodeAt(0))
  );
}
