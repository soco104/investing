import { NextRequest, NextResponse } from "next/server";

import { startOtelSpan } from "@/lib/observability";
import {
  attachSessionCookie,
  authenticatePassword,
  createSessionToken,
} from "@/lib/server/auth";
import {
  checkDemoChallenge,
  DEMO_SECURITY_QUESTION,
} from "@/lib/server/demo-challenge";
import { buildDistrictSsoStartUrl } from "@/lib/server/sso";

export async function POST(request: NextRequest) {
  const span = startOtelSpan("auth.login");

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      provider?: string;
      securityAnswer?: string;
    };
    const provider = body.provider ?? "password";

    if (provider !== "password") {
      const start = buildDistrictSsoStartUrl();

      if (start) {
        const response = NextResponse.json({
          ok: true,
          provider: "district-sso",
          redirectUrl: start.redirectUrl,
          telemetry: span.end(),
        });

        response.cookies.set("futurefund_sso_state", start.state, {
          httpOnly: true,
          maxAge: 60 * 10,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
        response.cookies.set("futurefund_sso_nonce", start.nonce, {
          httpOnly: true,
          maxAge: 60 * 10,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });

        return response;
      }

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

    const user = await authenticatePassword(email, password);

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "The email or password did not match a FutureFund account.",
          telemetry: span.end(),
        },
        { status: 401 }
      );
    }

    // Demo accounts have published passwords, so they also need the security
    // question. It is only shown after the password is correct.
    const challenge = checkDemoChallenge({
      email,
      answer: body.securityAnswer,
      clientKey: email,
    });

    if (challenge.status === "unconfigured") {
      return NextResponse.json(
        {
          ok: false,
          message: "Demo login is not available right now.",
          telemetry: span.end(),
        },
        { status: 403 }
      );
    }

    if (challenge.status === "locked") {
      return NextResponse.json(
        {
          ok: false,
          message: `Too many wrong answers. Try again in ${Math.ceil(
            challenge.retryAfterSeconds / 60
          )} minutes.`,
          telemetry: span.end(),
        },
        {
          status: 429,
          headers: { "Retry-After": String(challenge.retryAfterSeconds) },
        }
      );
    }

    if (challenge.status === "required" || challenge.status === "wrong") {
      return NextResponse.json(
        {
          ok: false,
          challenge: { question: DEMO_SECURITY_QUESTION },
          message:
            challenge.status === "wrong"
              ? `That answer isn't right. ${challenge.remaining} ${
                  challenge.remaining === 1 ? "try" : "tries"
                } left.`
              : "Answer the security question to finish signing in.",
          telemetry: span.end(),
        },
        { status: 401 }
      );
    }

    const token = await createSessionToken(user, request);
    const response = NextResponse.json({
      ok: true,
      session: {
        token,
        authMethod: "password",
        issuedAt: new Date().toISOString(),
      },
      user,
      telemetry: span.end(),
    });

    attachSessionCookie(response, token);

    return response;
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
