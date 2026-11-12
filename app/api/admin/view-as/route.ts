import { recordAuditEvent } from "@/lib/server/audit";
import {
  requirePermission,
  sessionTokenHashFromRequest,
  userFromRequest,
} from "@/lib/server/auth";
import {
  findUserById,
  getSql,
  hasProductionDatabase,
  setSessionViewAs,
} from "@/lib/server/repository";

/**
 * "View as student": an admin uses the app as a specific student, with the
 * student's full features, to troubleshoot. The admin's own session is
 * pointed at the student until they exit or sign out (no separate time
 * limit). The student is not notified; actions taken are marked in the
 * student's portfolio history as done by the admin, and everything is
 * recorded in the audit log.
 */

// Start viewing as a student.
export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) return response;

  if (user.role !== "Admin") {
    return Response.json(
      { message: "Only admins can view as a student.", ok: false },
      { status: 403 }
    );
  }

  if (!hasProductionDatabase()) {
    return Response.json(
      { message: "View as student needs a database (DATABASE_URL).", ok: false },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    reason?: string;
    studentEmail?: string;
  };
  const email = body.studentEmail?.trim().toLowerCase() ?? "";
  const reason = body.reason?.trim() ?? "";

  if (!email || !reason) {
    return Response.json(
      { message: "Enter the student's email and a reason.", ok: false },
      { status: 400 }
    );
  }

  const [row] = await getSql()<Array<{ id: string }>>`
    select id from app_users where lower(email) = ${email}
  `;
  const student = row ? await findUserById(row.id) : null;

  if (!student) {
    return Response.json(
      { message: `No active user was found with the email ${email}.`, ok: false },
      { status: 404 }
    );
  }

  if (student.role !== "Student") {
    return Response.json(
      { message: "View as is only for student accounts.", ok: false },
      { status: 400 }
    );
  }

  const tokenHash = await sessionTokenHashFromRequest(request);

  if (!tokenHash) {
    return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });
  }

  await setSessionViewAs(tokenHash, { reason, userId: student.id });
  const audit = await recordAuditEvent({
    action: "view_as.started",
    actor: user,
    context: { studentEmail: student.email, studentId: student.id },
    reason,
    targetId: student.id,
    targetType: "user",
  });

  return Response.json({
    audit,
    ok: true,
    student: {
      email: student.email,
      name: `${student.firstName} ${student.lastName}`.trim(),
    },
  });
}

// Stop viewing as the student and go back to the admin's own account.
export async function DELETE(request: Request) {
  const user = await userFromRequest(request);

  if (!user) {
    return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });
  }

  if (!user.actingAdmin) {
    return Response.json(
      { message: "You aren't viewing as a student.", ok: false },
      { status: 400 }
    );
  }

  const tokenHash = await sessionTokenHashFromRequest(request);

  if (!tokenHash) {
    return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });
  }

  await setSessionViewAs(tokenHash, null);
  const audit = await recordAuditEvent({
    action: "view_as.ended",
    actor: user.actingAdmin,
    context: { studentEmail: user.email, studentId: user.id },
    reason: "Exited view as student",
    targetId: user.id,
    targetType: "user",
  });

  return Response.json({ audit, ok: true });
}
