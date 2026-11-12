import { requirePermission } from "@/lib/server/auth";
import { listSubmissions, questErrorResponse } from "@/lib/server/quests";

// Teachers: each assigned class's students, their submissions and comments.
export async function GET(request: Request) {
  const { response, user } = await requirePermission(request, "teacherPortal");

  if (response || !user) return response;

  const questId = new URL(request.url).searchParams.get("questId");
  if (!questId) {
    return Response.json({ message: "questId is required.", ok: false }, { status: 400 });
  }

  try {
    return Response.json({ ok: true, ...(await listSubmissions(user, questId)) });
  } catch (error) {
    return questErrorResponse(error);
  }
}
