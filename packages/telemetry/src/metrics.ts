/**
 * OpenTelemetry metrics wrapper. Mirrors `getTracer` shape.
 *
 * Usage:
 *   const meter = getMeter('files-service');
 *   const counter = meter.createCounter('uploads_total');
 *   counter.add(1, { mime: 'application/pdf' });
 */

import { metrics, type Meter } from '@opentelemetry/api';

const DEFAULT_METER_NAME = '@toolforge/telemetry';

export function getMeter(name: string = DEFAULT_METER_NAME): Meter {
  return metrics.getMeter(name);
}
