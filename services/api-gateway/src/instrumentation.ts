/**
 * OpenTelemetry instrumentation preload.
 *
 * Loaded via `node -r ./dist/instrumentation.js` (prod) or
 * `tsx -r ./src/instrumentation.ts` (dev). MUST be the first module to run,
 * before any other import that creates network or DB connections — auto
 * instrumentation patches at require/import time.
 *
 * The actual SDK bootstrap is delegated to @toolforge/telemetry/node so the
 * same setup is reused across every service.
 */

import { startTelemetry } from '@toolforge/telemetry/node';

// Preload runs before env.ts can be imported (auto-instrumentation must patch
// before any HTTP/DB module is required). Reading OTEL_SERVICE_NAME directly
// here is the documented exception to the `@toolforge/env` rule.
// eslint-disable-next-line no-restricted-properties
const otelServiceName = process.env.OTEL_SERVICE_NAME ?? 'api-gateway';

startTelemetry({
  serviceName: otelServiceName,
  serviceNamespace: 'toolforge',
  // The SDK reads OTEL_EXPORTER_OTLP_ENDPOINT and OTEL_RESOURCE_ATTRIBUTES
  // from the environment automatically.
});
