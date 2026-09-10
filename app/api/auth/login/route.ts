import { NextRequest, NextResponse } from "next/server";

import { startOtelSpan } from "@/lib/observability";

type AuthRole = "Student" | "Teacher" | "Admin";

type SeedAuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  alias: string;
  role: AuthRole;
  className: string;
  passwordHash: string;
  permissions: {
    studentProfile: boolean;
    teacherPortal: boolean;
    adminPortal: boolean;
    questImportExport: boolean;
    portfolioCorrections: boolean;
  };
};

const seedAuthUsers: SeedAuthUser[] = [
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

export async function POST(request: NextRequest) {
  const span = startOtelSpan("auth.login");

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      provider?: string;
    };
    const provider = body.provider ?? "password";

    if (provider !== "password") {
      return NextResponse.json(
        {
          ok: false,
          message:
            "District SSO is ready for configuration, but no identity provider is connected yet.",
          telemetry: span.end(),
        },
        { status: 501 }
      );
    }

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        {
          ok: false,
          message: "Email and password are required.",
          telemetry: span.end(),
        },
        { status: 400 }
      );
    }

    const user = seedAuthUsers.find((item) => item.email.toLowerCase() === email);
    const passwordHash = await hashPassword(password);

    if (!user || passwordHash !== user.passwordHash) {
      return NextResponse.json(
        {
          ok: false,
          message: "The email or password did not match a FutureFund account.",
          telemetry: span.end(),
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      session: {
        token: await hashPassword(`${user.id}-${Date.now()}`),
        authMethod: "password",
        issuedAt: new Date().toISOString(),
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        alias: user.alias,
        role: user.role,
        className: user.className,
        permissions: user.permissions,
      },
      telemetry: span.end(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Login could not be completed.",
        telemetry: span.end(),
      },
      { status: 500 }
    );
  }
}

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
