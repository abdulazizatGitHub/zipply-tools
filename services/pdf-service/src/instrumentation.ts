/**
 * OpenTelemetry preload — see services/api-gateway/src/instrumentation.ts
 * for the canonical pattern. MUST be the first module to run.
 */

import { startTelemetry } from '@toolforge/telemetry/node';

// Preload runs before env.ts can be imported (auto-instrumentation must patch
// before any HTTP/DB module is required). Reading OTEL_SERVICE_NAME directly
// here is the documented exception to the `@toolforge/env` rule.
// eslint-disable-next-line no-restricted-properties
const otelServiceName = process.env.OTEL_SERVICE_NAME ?? 'pdf-service';

startTelemetry({
  serviceName: otelServiceName,
  serviceNamespace: 'toolforge',
});
