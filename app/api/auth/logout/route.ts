import { NextResponse } from "next/server";

import { clearSessionCookie, revokeCurrentSession } from "@/lib/server/auth";

export async function POST(request: Request) {
  await revokeCurrentSession(request);

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);

  return response;
}
