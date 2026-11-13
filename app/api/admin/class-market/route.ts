import { recordAuditEvent } from "@/lib/server/audit";
import { userFromRequest } from "@/lib/server/auth";
import { normalizeClassMarketConfig } from "@/lib/server/market-engine";
import { portfolioErrorResponse, saveClassGradeLevel } from "@/lib/server/portfolios";
import { saveClassInfoLevel } from "@/lib/server/stock-info";
import {
  getClassMarketState,
  upsertClassMarketConfig,
} from "@/lib/server/repository";

type ClassMarketMutationRequest = {
  allowedAssetTypes?: string[];
  allowedSymbols?: string[] | string;
  className?: string;
  eventScenario?: string;
  // Grade 1–12, or null to clear (then it's read from the class name).
  // Grade 10+ classes can trade fractional shares.
  gradeLevel?: number | null;
  reason?: string;
  simulationMode?: string;
  // "basic", "full", or null to follow the grade level (v0.2.11).
  stockInfoLevel?: "basic" | "full" | null;
  startingCashCents?: number;
  teacherControlsEnabled?: boolean;
  volatilityMultiplier?: number;
};

export async function GET(request: Request) {
  const user = await userFromRequest(request);

  if (!user) {
    return Response.json(
      { message: "Authentication is required.", ok: false },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const className = url.searchParams.get("className") ?? user.className;

  if (!canManageClassMarket(user, className)) {
    return Response.json(
      { message: "This account cannot view that class market.", ok: false },
      { status: 403 }
    );
  }

  return Response.json({
    classMarket: await getClassMarketState(className),
    ok: true,
  });
}

export async function POST(request: Request) {
  const user = await userFromRequest(request);

  if (!user) {
    return Response.json(
      { message: "Authentication is required.", ok: false },
      { status: 401 }
    );
  }

  const body = (await request.json()) as ClassMarketMutationRequest;
  const className = body.className?.trim() || user.className;

  if (!className) {
    return Response.json(
      { message: "className is required.", ok: false },
      { status: 400 }
    );
  }

  if (!canManageClassMarket(user, className)) {
    return Response.json(
      { message: "This account cannot configure that class market.", ok: false },
      { status: 403 }
    );
  }

  const config = normalizeClassMarketConfig({
    allowedAssetTypes: body.allowedAssetTypes,
    allowedSymbols: body.allowedSymbols,
    className,
    eventScenario: body.eventScenario,
    simulationMode: body.simulationMode,
    startingCashCents: body.startingCashCents,
    teacherControlsEnabled: body.teacherControlsEnabled,
    volatilityMultiplier: body.volatilityMultiplier,
  });
  const audit = await recordAuditEvent({
    action: "class_market.updated",
    actor: user,
    context: {
      allowedAssetTypes: config.allowedAssetTypes,
      allowedSymbols:
        config.allowedSymbols.length > 0 ? "teacher_defined" : "provider_default",
      eventScenario: config.eventScenario,
      simulationMode: config.simulationMode,
      startingCashCents: config.startingCashCents,
      teacherControlsEnabled: config.teacherControlsEnabled,
      volatilityMultiplier: config.volatilityMultiplier,
      ...("gradeLevel" in body ? { gradeLevel: body.gradeLevel ?? null } : {}),
      ...("stockInfoLevel" in body ? { stockInfoLevel: body.stockInfoLevel ?? "grade default" } : {}),
    },
    reason: body.reason ?? "Class market configuration update",
    targetId: className,
    targetType: "class_market",
  });

  await upsertClassMarketConfig({ actor: user, config });

  if ("gradeLevel" in body) {
    try {
      await saveClassGradeLevel(className, body.gradeLevel ?? null);
    } catch (error) {
      return portfolioErrorResponse(error);
    }
  }

  if ("stockInfoLevel" in body) {
    try {
      await saveClassInfoLevel(user, className, body.stockInfoLevel ?? null);
    } catch (error) {
      return portfolioErrorResponse(error);
    }
  }

  return Response.json(
    {
      audit,
      classMarket: await getClassMarketState(className),
      ok: true,
      persisted: true,
    },
    { status: 201 }
  );
}

function canManageClassMarket(
  user: Awaited<ReturnType<typeof userFromRequest>>,
  className: string
) {
  if (!user) {
    return false;
  }

  if (user.role === "Admin" || user.permissions.adminPortal) {
    return true;
  }

  return user.permissions.teacherPortal && user.classNames.includes(className);
}
