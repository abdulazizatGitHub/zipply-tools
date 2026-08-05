/**
 * Liveness endpoint for the web app. Used by container orchestrators and
 * Cloudflare health checks. Returns 200 once Next is responding.
 *
 * Readiness (deps reachable) is intentionally NOT exposed from the web app
 * — the web app degrades gracefully when downstream services flake; we
 * don't want a downstream blip to take the marketing surface offline.
 */
export function GET(): Response {
  return Response.json({ status: 'ok' });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
