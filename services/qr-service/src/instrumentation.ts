import { startTelemetry } from '@toolforge/telemetry/node';
// eslint-disable-next-line no-restricted-properties
const otelServiceName = process.env.OTEL_SERVICE_NAME ?? 'qr-service';
startTelemetry({ serviceName: otelServiceName, serviceNamespace: 'toolforge' });
