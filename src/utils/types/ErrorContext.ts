/**
 * Error context for safe axios operations
 */
export interface ErrorContext {
  type: "validation" | "network" | "timeout" | "unknown";
  url: string;
  method: string;
  statusCode?: number;
  originalError?: unknown;
}
