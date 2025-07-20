/**
 * Retry Utilities - Pure functions for retry logic
 * Following Functional Programming (FP) principles
 */

import { RetryConfig } from "../domain/types";

/**
 * Calculates delay for retry attempts with improved performance
 * Pure function - no side effects, deterministic output
 *
 * @param attempt - Current attempt number (1-based)
 * @param baseDelay - Base delay in milliseconds
 * @param backoff - Backoff strategy ('linear' or 'exponential')
 * @returns Calculated delay in milliseconds
 */
export function calculateRetryDelay(
  attempt: number,
  baseDelay: number,
  backoff: "linear" | "exponential",
): number {
  // Handle invalid attempt numbers
  if (attempt <= 0) {
    return 0;
  }

  // Handle invalid base delay
  if (baseDelay < 0) {
    return 0;
  }

  if (backoff === "exponential") {
    // Use bit shifting for better performance with small numbers
    const multiplier =
      attempt <= 31 ? 1 << (attempt - 1) : Math.pow(2, attempt - 1);
    return baseDelay * multiplier;
  }

  return baseDelay * attempt;
}

/**
 * Checks if retry should be attempted with improved logic
 * Pure function - no side effects, deterministic output
 *
 * @param attempt - Current attempt number
 * @param maxAttempts - Maximum number of attempts
 * @param error - Error that occurred
 * @param retryOn - Custom retry condition function
 * @returns Whether retry should be attempted
 */
export function shouldRetry(
  attempt: number,
  maxAttempts: number,
  error: unknown,
  retryOn?: (error: unknown) => boolean,
): boolean {
  if (attempt >= maxAttempts) {
    return false;
  }

  if (retryOn) {
    return retryOn(error);
  }

  // Default retry logic - retry on any error unless it's a validation error
  return !isRetryableValidationError(error);
}

/**
 * Determines if an error is retryable with comprehensive error detection
 * Pure function - no side effects, deterministic output
 *
 * @param error - Error to check
 * @returns Whether the error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorObj = error as Record<string, unknown>;

  // Network errors
  const networkErrorCodes = [
    "ECONNABORTED",
    "ENOTFOUND",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ERR_NETWORK",
  ];
  if (
    typeof errorObj.code === "string" &&
    networkErrorCodes.includes(errorObj.code)
  ) {
    return true;
  }

  // HTTP 5xx errors
  if (errorObj.response && typeof errorObj.response === "object") {
    const response = errorObj.response as Record<string, unknown>;
    if (
      typeof response.status === "number" &&
      response.status >= 500 &&
      response.status < 600
    ) {
      return true;
    }
  }

  // Timeout errors
  if (
    typeof errorObj.message === "string" &&
    errorObj.message.toLowerCase().includes("timeout")
  ) {
    return true;
  }

  return false;
}

/**
 * Determines if an error is a validation error that should not be retried
 * Pure function - no side effects, deterministic output
 *
 * @param error - Error to check
 * @returns Whether the error is a validation error
 */
export function isRetryableValidationError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorObj = error as Record<string, unknown>;

  // Check for validation error codes
  const validationErrorCodes = ["VALIDATION_ERROR", "INVALID_INPUT"];
  if (
    typeof errorObj.code === "string" &&
    validationErrorCodes.includes(errorObj.code)
  ) {
    return true;
  }

  // Check for validation error type
  if (errorObj.type === "validation") {
    return true;
  }

  // Check for validation error messages
  if (typeof errorObj.message === "string") {
    const message = errorObj.message.toLowerCase();
    const validationKeywords = [
      "validation",
      "invalid",
      "required",
      "schema",
      "type",
    ];
    if (validationKeywords.some((keyword) => message.includes(keyword))) {
      return true;
    }
  }

  // HTTP 4xx errors (except 429 - too many requests)
  if (errorObj.response && typeof errorObj.response === "object") {
    const response = errorObj.response as Record<string, unknown>;
    if (
      typeof response.status === "number" &&
      response.status >= 400 &&
      response.status < 500 &&
      response.status !== 429
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Creates retry configuration with defaults and validation
 * Pure function - no side effects, deterministic output
 *
 * @param attempts - Number of retry attempts
 * @param delay - Base delay in milliseconds
 * @param backoff - Backoff strategy
 * @param retryOn - Custom retry condition function
 * @returns Retry configuration object
 */
export function createRetryConfig(
  attempts: number = 3,
  delay: number = 1000,
  backoff: "linear" | "exponential" = "exponential",
  retryOn?: (error: unknown) => boolean,
): RetryConfig {
  return {
    attempts: Math.max(1, attempts),
    delay: Math.max(0, delay),
    backoff,
    retryOn,
  };
}

/**
 * Validates retry configuration with comprehensive checks
 * Pure function - no side effects, deterministic output
 *
 * @param config - Retry configuration to validate
 * @returns Error message if invalid, null if valid
 */
export function validateRetryConfig(config: RetryConfig): string | null {
  if (!config || typeof config !== "object") {
    return "Retry configuration must be an object";
  }

  if (typeof config.attempts !== "number" || config.attempts < 1) {
    return "Attempts must be at least 1";
  }

  if (typeof config.delay !== "number" || config.delay < 0) {
    return "Delay must be non-negative";
  }

  if (!["linear", "exponential"].includes(config.backoff)) {
    return 'Backoff must be either "linear" or "exponential"';
  }

  if (config.retryOn && typeof config.retryOn !== "function") {
    return "Retry condition must be a function";
  }

  return null;
}

/**
 * Merges retry configurations with validation
 * Pure function - no side effects, deterministic output
 *
 * @param base - Base retry configuration
 * @param override - Override configuration
 * @returns Merged retry configuration
 */
export function mergeRetryConfigs(
  base: RetryConfig,
  override: Partial<RetryConfig>,
): RetryConfig {
  const merged = {
    ...base,
    ...override,
  };

  // Validate the merged configuration
  const validationError = validateRetryConfig(merged);
  if (validationError) {
    throw new Error(`Invalid merged retry configuration: ${validationError}`);
  }

  return merged;
}

/**
 * Creates a retry strategy function with memoization for performance
 * Pure function - no side effects, deterministic output
 *
 * @param config - Retry configuration
 * @returns Retry strategy object with shouldRetry and getDelay methods
 */
export function createRetryStrategy(config: RetryConfig) {
  // Validate configuration
  const validationError = validateRetryConfig(config);
  if (validationError) {
    throw new Error(`Invalid retry configuration: ${validationError}`);
  }

  return {
    shouldRetry: (attempt: number, error: unknown): boolean =>
      shouldRetry(attempt, config.attempts, error, config.retryOn),
    getDelay: (attempt: number): number =>
      calculateRetryDelay(attempt, config.delay, config.backoff),
  };
}
