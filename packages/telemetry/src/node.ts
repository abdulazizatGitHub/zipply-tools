/**
 * Node SDK bootstrap. Services import this ONCE, before any other module
 * that produces traces or metrics. Typical placement: as the first import
 * in the service entrypoint via `node -r ./dist/instrumentation.js`.
 *
 *   // services/<name>/src/instrumentation.ts
 *   import { startTelemetry } from '@toolforge/telemetry/node';
 *   startTelemetry({ serviceName: 'pdf-service', serviceNamespace: 'toolforge' });
 */

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

export interface StartTelemetryOptions {
  serviceName: string;
  /** Logical grouping (e.g. 'toolforge'). Emitted as `service.namespace`. */
  serviceNamespace?: string;
  serviceVersion?: string;
  /** OTLP endpoint base URL. Defaults to OTEL_EXPORTER_OTLP_ENDPOINT env var. */
  otlpEndpoint?: string;
  /** Disable auto-instrumentation when running tests or scripts. */
  disabled?: boolean;
}

let sdk: NodeSDK | null = null;

/**
 * Initialize the Node OTel SDK. Idempotent — second call is a no-op so test
 * environments don't double-init.
 */
export function startTelemetry(options: StartTelemetryOptions): void {
  if (sdk) return;
  if (options.disabled) return;

  const endpoint = options.otlpEndpoint ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  const attributes: Record<string, string> = {
    [ATTR_SERVICE_NAME]: options.serviceName,
  };
  if (options.serviceNamespace) {
    attributes['service.namespace'] = options.serviceNamespace;
  }
  if (options.serviceVersion) {
    attributes[ATTR_SERVICE_VERSION] = options.serviceVersion;
  }

  sdk = new NodeSDK({
    resource: new Resource(attributes),
    traceExporter: endpoint ? new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }) : undefined,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  // Graceful shutdown on process termination — flush buffered spans.
  const shutdown = (): void => {
    sdk
      ?.shutdown()
      .catch(() => undefined)
      .finally(() => process.exit(0));
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

/** Alias kept for backward source compatibility. Prefer `startTelemetry`. */
export const initTelemetry = startTelemetry;
export type InitTelemetryOptions = StartTelemetryOptions;

export function shutdownTelemetry(): Promise<void> {
  return sdk?.shutdown() ?? Promise.resolve();
}
