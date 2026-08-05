/**
 * HTTP header constants used by the platform for trace and request context.
 * These match W3C Trace Context where applicable; the X-Toolforge-* ones are
 * internal conventions for the api-gateway → service hop.
 */
export const TELEMETRY_HEADERS = {
  TRACEPARENT: 'traceparent',
  TRACESTATE: 'tracestate',
  REQUEST_ID: 'x-toolforge-request-id',
  USER_ID: 'x-toolforge-user-id',
  ORG_ID: 'x-toolforge-org-id',
  PLAN: 'x-toolforge-plan',
  TOOL_ID: 'x-toolforge-tool-id',
  LOCALE: 'x-toolforge-locale',
} as const;

export type TelemetryHeader = (typeof TELEMETRY_HEADERS)[keyof typeof TELEMETRY_HEADERS];
