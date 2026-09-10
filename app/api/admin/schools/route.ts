import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { createSchool, deleteSchool } from "@/lib/server/repository";

type SchoolMutationRequest = {
  action: "create" | "delete";
  classCount?: number;
  district?: string;
  name?: string;
  reason?: string;
  schoolId?: string;
  state?: string;
  studentCount?: number;
};

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) {
    return response;
  }

  const body = (await request.json()) as SchoolMutationRequest;

  if (body.action === "create" && (!body.name || !body.district)) {
    return Response.json(
      { message: "name and district are required.", ok: false },
      { status: 400 }
    );
  }

  if (body.action === "delete" && !body.schoolId) {
    return Response.json(
      { message: "schoolId is required.", ok: false },
      { status: 400 }
    );
  }

  if (body.action === "create") {
    await createSchool({
      classCount: body.classCount ?? 0,
      district: body.district ?? "",
      name: body.name ?? "",
      schoolId: body.schoolId ?? `school-${Date.now()}`,
      state: body.state ?? "NA",
      studentCount: body.studentCount ?? 0,
    });
  } else {
    await deleteSchool(body.schoolId ?? "");
  }

  const audit = await recordAuditEvent({
    action: body.action === "create" ? "school.created" : "school.deleted",
    actor: user,
    context: {
      classCount: body.classCount,
      district: body.district,
      name: body.name,
      state: body.state,
      studentCount: body.studentCount,
    },
    reason: body.reason,
    targetId: body.schoolId ?? `school-${Date.now()}`,
    targetType: "school",
  });

  return Response.json({ audit, ok: true, persisted: true }, { status: 201 });
}
