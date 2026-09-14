import postgres from "postgres";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      {
        database: "not-configured",
        ok: false,
        service: "futurefund-classroom",
      },
      { status: 503 }
    );
  }

  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
  });

  try {
    await sql`select 1 as ok`;

    return Response.json({
      database: "ok",
      ok: true,
      service: "futurefund-classroom",
    });
  } catch (error) {
    console.error("Health check database failure:", error);

    return Response.json(
      {
        database: "unavailable",
        ok: false,
        service: "futurefund-classroom",
      },
      { status: 503 }
    );
  } finally {
    await sql.end({ timeout: 1 });
  }
}
