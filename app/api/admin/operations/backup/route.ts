import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { createBackupJob } from "@/lib/server/repository";

type BackupOperationRequest = {
  backupLocation?: string;
  jobType: "backup" | "restore-test";
  reason: string;
};

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) {
    return response;
  }

  const body = (await request.json()) as BackupOperationRequest;

  if (!body.jobType || !body.reason) {
    return Response.json(
      { message: "jobType and reason are required.", ok: false },
      { status: 400 }
    );
  }

  const backupId = `backup-${Date.now()}`;
  const audit = await recordAuditEvent({
    action: "backup.requested",
    actor: user,
    context: {
      backupLocation: body.backupLocation ?? "cloud-sql-managed-backups",
      jobType: body.jobType,
      procedure:
        body.jobType === "restore-test"
          ? "Run restore into isolated project, verify migrations, confirm login and admin pages."
          : "Verify Cloud SQL automated backup, PITR window, and latest backup timestamp.",
    },
    reason: body.reason,
    targetId: backupId,
    targetType: "backup_job",
  });
  await createBackupJob({
    backupLocation: body.backupLocation ?? "cloud-sql-managed-backups",
    jobType: body.jobType,
  });

  return Response.json(
    {
      audit,
      job: {
        backupLocation: body.backupLocation ?? "cloud-sql-managed-backups",
        jobType: body.jobType,
        status: "scheduled",
      },
      ok: true,
    },
    { status: 202 }
  );
}
