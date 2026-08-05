/**
 * @toolforge/platform-client
 *
 * The base for all internal service clients. Domain client packages
 * (billing-client, files-client, ai-client) extend HttpClient and add
 * resource-specific methods. The wire details — retries, headers, errors —
 * are owned here.
 */

export { HttpClient, type HttpClientOptions } from './http-client.js';
export { type RequestOptions, type RetryPolicy } from './types.js';
export { ClientError, parseProblemDetails } from './errors.js';
