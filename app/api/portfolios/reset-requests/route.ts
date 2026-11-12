import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import {
  createResetRequest,
  listResetRequests,
  listTeacherStudents,
  portfolioErrorResponse,
} from "@/lib/server/portfolios";

// Teachers: the students in their classes, and the reset requests they've made.
export async function GET(request: Request) {
  const { response, user } = await requirePermission(request, "teacherPortal");

  if (response || !user) return response;

  try {
    const [students, requests] = await Promise.all([
      listTeacherStudents(user),
      listResetRequests({ requestedBy: user.id }),
    ]);

    return Response.json({
      ok: true,
      requests,
      students: students.map((student) => ({
        className: student.class_name,
        email: student.email,
        name: `${student.first_name} ${student.last_name}`.trim(),
      })),
    });
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}

// Teachers: ask an admin to reset a student's current class portfolio.
export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "teacherPortal");

  if (response || !user) return response;

  const body = (await request.json().catch(() => ({}))) as {
    className?: string;
    reason?: string;
    studentEmail?: string;
  };

  if (!body.studentEmail || !body.className || !body.reason?.trim()) {
    return Response.json(
      { message: "Choose a student and give a reason.", ok: false },
      { status: 400 }
    );
  }

  try {
    const created = await createResetRequest({
      className: body.className,
      reason: body.reason,
      requester: user,
      studentEmail: body.studentEmail,
    });
    const audit = await recordAuditEvent({
      action: "portfolio_reset.requested",
      actor: user,
      context: { className: body.className, studentEmail: body.studentEmail.toLowerCase() },
      reason: body.reason,
      targetId: created.portfolioId,
      targetType: "portfolio",
    });

    return Response.json({ audit, ok: true, ...created }, { status: 201 });
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}
