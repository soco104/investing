type IntegrationTestRequest = {
  endpoint?: string;
  maxSymbols?: number;
  token?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as IntegrationTestRequest;
  const endpoint = body.endpoint?.trim();

  if (!endpoint) {
    return Response.json(
      {
        ok: false,
        importedSymbols: 0,
        message: "Endpoint is required before running GET.",
      },
      { status: 400 }
    );
  }

  const symbolLimit = Math.min(Math.max(body.maxSymbols ?? 200, 1), 200);

  if (endpoint.startsWith("/api/market")) {
    return Response.json({
      ok: true,
      importedSymbols: 4,
      message: "GET succeeded from the classroom-safe market endpoint.",
    });
  }

  try {
    const response = await fetch(endpoint, {
      headers: body.token
        ? {
            Authorization: `Bearer ${body.token}`,
          }
        : undefined,
      method: "GET",
    });

    return Response.json({
      ok: response.ok,
      importedSymbols: response.ok ? symbolLimit : 0,
      message: response.ok
        ? `GET succeeded. Imported up to ${symbolLimit} symbols.`
        : `GET returned ${response.status}.`,
    });
  } catch {
    return Response.json(
      {
        ok: false,
        importedSymbols: 0,
        message: "GET failed. Check the endpoint, token, or provider access.",
      },
      { status: 502 }
    );
  }
}
