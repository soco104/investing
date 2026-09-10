import { hashToken } from "@/lib/server/crypto";
import { completePasswordReset } from "@/lib/server/repository";

type ResetPasswordRequest = {
  newPassword?: string;
  token?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ResetPasswordRequest;

  if (!body.token || !body.newPassword || body.newPassword.length < 10) {
    return Response.json(
      {
        message: "A valid reset token and a password of at least 10 characters are required.",
        ok: false,
      },
      { status: 400 }
    );
  }

  const completed = await completePasswordReset({
    newPassword: body.newPassword,
    tokenHash: await hashToken(body.token),
  });

  if (!completed) {
    return Response.json(
      { message: "The reset token is invalid or expired.", ok: false },
      { status: 400 }
    );
  }

  return Response.json({ ok: true, resetStatus: "completed" });
}
