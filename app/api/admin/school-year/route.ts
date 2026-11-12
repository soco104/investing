import { DEFAULT_SCHOOL_YEAR, schoolYearFor } from "@/lib/school-year";
import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import {
  getSchoolYearSettings,
  portfolioErrorResponse,
  saveSchoolYearSettings,
} from "@/lib/server/portfolios";

export async function GET(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) return response;

  const settings = await getSchoolYearSettings();

  return Response.json({
    current: schoolYearFor(new Date(), settings).label,
    defaults: DEFAULT_SCHOOL_YEAR,
    ok: true,
    settings,
  });
}

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) return response;

  const body = (await request.json().catch(() => ({}))) as { end?: string; start?: string };

  try {
    const settings = { end: String(body.end ?? ""), start: String(body.start ?? "") };
    await saveSchoolYearSettings(settings, user);
    const audit = await recordAuditEvent({
      action: "school_year.updated",
      actor: user,
      context: settings,
      reason: "Admin school year update",
      targetId: "district",
      targetType: "district_settings",
    });

    return Response.json({
      audit,
      current: schoolYearFor(new Date(), settings).label,
      ok: true,
      settings,
    });
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}
