/**
 * Next.js instrumentation hook. Called once per process boot on the server
 * side. Enabled via `experimental.instrumentationHook` in next.config.mjs.
 *
 * Dynamic import is required: this module is loaded in both Node and Edge
 * runtimes; the OTel Node SDK must only load in Node.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startTelemetry } = await import('@toolforge/telemetry/node');
    startTelemetry({
      serviceName: process.env.OTEL_SERVICE_NAME ?? 'web',
      serviceNamespace: 'toolforge',
    });
  }
}
