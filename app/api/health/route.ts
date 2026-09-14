export async function GET() {
  return Response.json({
    ok: true,
    service: "futurefund-classroom",
    timestamp: new Date().toISOString(),
  });
}

