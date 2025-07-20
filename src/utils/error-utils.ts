/**
 * Error Utilities - Pure functions for error handling
 * Following Functional Programming (FP) principles
 */

import { ErrorType, ValidationContext } from "../domain/types";

/**
 * Categorizes errors by type
 * Pure function - no side effects, deterministic output
 */
export function categorizeError(error: unknown): ErrorType {
  if (!error || typeof error !== "object") {
    return "unknown";
  }

  const errorObj = error as any;

  // Network errors
  if (
    errorObj.code === "ECONNABORTED" ||
    errorObj.code === "ENOTFOUND" ||
    errorObj.code === "ECONNREFUSED" ||
    errorObj.code === "ERR_NETWORK"
  ) {
    return "network";
  }

  // Timeout errors
  if (
    errorObj.code === "ETIMEDOUT" ||
    (errorObj.message && errorObj.message.includes("timeout"))
  ) {
    return "timeout";
  }

  // HTTP errors
  if (errorObj.response && errorObj.response.status) {
    return "http";
  }

  // Validation errors
  if (
    errorObj.message &&
    (errorObj.message.includes("validation") ||
      errorObj.message.includes("Validation") ||
      errorObj.message.includes("VALIDATION"))
  ) {
    return "validation";
  }

  return "unknown";
}

/**
 * Extracts error message from various error types
 * Pure function - no side effects, deterministic output
 */
export function extractErrorMessage(error: unknown): string {
  if (!error) {
    return "Unknown error";
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object") {
    const errorObj = error as any;

    if (errorObj.message) {
      return errorObj.message;
    }

    if (errorObj.error) {
      return errorObj.error;
    }

    if (errorObj.toString) {
      return errorObj.toString();
    }
  }

  return "Unknown error";
}

/**
 * Extracts HTTP status code from error
 * Pure function - no side effects, deterministic output
 */
export function extractHttpStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const errorObj = error as any;

  if (errorObj.response && errorObj.response.status) {
    return errorObj.response.status;
  }

  if (errorObj.status) {
    return errorObj.status;
  }

  if (errorObj.statusCode) {
    return errorObj.statusCode;
  }

  return undefined;
}

/**
 * Creates a standardized error message
 * Pure function - no side effects, deterministic output
 */
export function createStandardErrorMessage(
  type: ErrorType,
  message: string,
  statusCode?: number,
): string {
  switch (type) {
    case "network":
      return `Network Error: ${message}`;
    case "timeout":
      return `Timeout Error: ${message}`;
    case "http":
      return `HTTP ${statusCode || "Error"}: ${message}`;
    case "validation":
      return `Validation Error: ${message}`;
    default:
      return message;
  }
}

/**
 * Formats error for logging
 * Pure function - no side effects, deterministic output
 */
export function formatErrorForLogging(
  error: unknown,
  context?: ValidationContext,
): string {
  const type = categorizeError(error);
  const message = extractErrorMessage(error);
  const statusCode = extractHttpStatusCode(error);

  let logMessage = createStandardErrorMessage(type, message, statusCode);

  if (context) {
    logMessage += ` | URL: ${context.url} | Method: ${context.method}`;
    if (context.statusCode) {
      logMessage += ` | Status: ${context.statusCode}`;
    }
  }

  return logMessage;
}

/**
 * Determines if error should be logged
 * Pure function - no side effects, deterministic output
 */
export function shouldLogError(error: unknown): boolean {
  const type = categorizeError(error);

  // Always log validation and unknown errors
  if (type === "validation" || type === "unknown") {
    return true;
  }

  // Log network and timeout errors
  if (type === "network" || type === "timeout") {
    return true;
  }

  // Log HTTP 5xx errors
  const statusCode = extractHttpStatusCode(error);
  if (statusCode && statusCode >= 500) {
    return true;
  }

  return false;
}

/**
 * Creates error context from error object
 * Pure function - no side effects, deterministic output
 */
export function createErrorContext(
  error: unknown,
  url: string,
  method: string,
): ValidationContext {
  return {
    type: categorizeError(error),
    url,
    method: method as any,
    statusCode: extractHttpStatusCode(error),
    originalError: error,
  };
}
