import { NextRequest, NextResponse } from "next/server";

// Read at REQUEST TIME — not build time, not startup time
// Changes to the ConfigMap take effect on pod restart
function getBackendUrl(): string {
  const url = process.env.BACKEND_URL;
  if (!url) {
    throw new Error("BACKEND_URL environment variable is not set");
  }
  return url.replace(/\/$/, ""); // strip trailing slash
}

async function proxy(req: NextRequest): Promise<NextResponse> {
  const backendUrl = getBackendUrl();

  // Extract the path after /api/
  // req.nextUrl.pathname = "/api/leaderboard"
  // forwarded path       = "/api/leaderboard"
  const targetUrl = `${backendUrl}${req.nextUrl.pathname}${req.nextUrl.search}`;

  // Forward the request to the backend
  const backendRes = await fetch(targetUrl, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      // Forward real IP to backend for rate limiting
      "X-Forwarded-For": req.headers.get("x-forwarded-for") ?? "",
      "X-Real-IP": req.headers.get("x-real-ip") ?? "",
    },
    // Forward body for POST requests
    body:
      req.method !== "GET" && req.method !== "HEAD"
        ? await req.text()
        : undefined,
    // Never cache proxy responses
    cache: "no-store",
  });

  const data = await backendRes.json();

  return NextResponse.json(data, { status: backendRes.status });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
