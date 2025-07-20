/**
 * Request Service - Core domain service for HTTP requests
 * Following Domain-Driven Design (DDD) principles
 */

import {
  RequestResult,
  RequestStatus,
  CompleteRequestConfig,
  ErrorType,
} from "../domain/types";
import {
  createSuccessResult,
  createErrorResult,
  validateRequestConfig,
} from "../utils/request-utils";
import {
  validateData,
  validateDataWithTolerance,
  createValidationContext,
} from "../utils/validation-utils";
import { createRetryStrategy, validateRetryConfig } from "../utils/retry-utils";
import {
  categorizeError,
  extractErrorMessage,
  extractHttpStatusCode,
  createErrorContext,
} from "../utils/error-utils";

/**
 * HTTP Client Interface - Dependency abstraction for testability
 * Following Dependency Inversion Principle
 */
export interface HttpClient {
  request(config: Record<string, unknown>): Promise<Record<string, unknown>>;
}

/**
 * Logger Interface - Dependency abstraction for testability
 * Following Dependency Inversion Principle
 */
export interface Logger {
  error(message: string, context?: unknown): void;
  warn(message: string, context?: unknown): void;
  info(message: string, context?: unknown): void;
  debug(message: string, context?: unknown): void;
}

/**
 * Request Service Configuration
 */
export interface RequestServiceConfig {
  httpClient: HttpClient;
  logger?: Logger;
  defaultTimeout?: number;
  defaultRetryConfig?: {
    attempts: number;
    delay: number;
    backoff: "linear" | "exponential";
  };
  enableDebugLogging?: boolean;
}

/**
 * Request Service - Core domain service
 * Following Single Responsibility Principle and Dependency Injection
 */
export class RequestService {
  private readonly httpClient: HttpClient;
  private readonly logger: Logger;
  private readonly defaultTimeout: number;
  private readonly defaultRetryConfig: {
    attempts: number;
    delay: number;
    backoff: "linear" | "exponential";
  };
  private readonly enableDebugLogging: boolean;

  constructor(config: RequestServiceConfig) {
    this.httpClient = config.httpClient;
    this.logger = config.logger || this.createDefaultLogger();
    this.defaultTimeout = config.defaultTimeout || 5000;
    this.defaultRetryConfig = config.defaultRetryConfig || {
      attempts: 3,
      delay: 1000,
      backoff: "exponential",
    };
    this.enableDebugLogging = config.enableDebugLogging || false;
  }

  /**
   * Executes a request with validation and retry logic
   * Main domain operation following DDD principles
   *
   * @param config - Complete request configuration
   * @returns Promise resolving to request result
   */
  async executeRequest<T>(
    config: CompleteRequestConfig<T>,
  ): Promise<RequestResult<T>> {
    const startTime = Date.now();

    try {
      this.logDebug("Starting request execution", {
        url: config.url,
        method: config.method,
      });

      // Validate configuration
      const configError = this.validateConfiguration(config);
      if (configError) {
        this.logError("Configuration validation failed", {
          error: configError,
          config,
        });
        return createErrorResult<T>(500, configError, "validation");
      }

      // Execute with retry logic if configured
      if (config.retry) {
        this.logDebug("Executing request with retry logic", {
          retryConfig: config.retry,
        });
        return this.executeWithRetry(config);
      }

      const result = await this.executeSingleRequest(config);
      const duration = Date.now() - startTime;

      this.logDebug("Request completed", {
        url: config.url,
        method: config.method,
        duration,
        status: result.status,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logError("Unexpected error during request execution", {
        error,
        config,
        duration,
      });
      return this.handleUnexpectedError<T>(error, config);
    }
  }

  /**
   * Executes a single request without retry
   * Pure business logic following DDD principles
   *
   * @param config - Complete request configuration
   * @returns Promise resolving to request result
   */
  private async executeSingleRequest<T>(
    config: CompleteRequestConfig<T>,
  ): Promise<RequestResult<T>> {
    try {
      // Prepare HTTP request
      const httpConfig = this.prepareHttpConfig(config);

      this.logDebug("Executing HTTP request", {
        url: httpConfig.url,
        method: httpConfig.method,
        hasData: !!httpConfig.data,
        hasHeaders: !!httpConfig.headers,
      });

      // Execute HTTP request
      const response = await this.httpClient.request(httpConfig);

      this.logDebug("HTTP request completed", {
        url: config.url,
        method: config.method,
        hasResponseData: !!response.data,
      });

      // Validate response data
      return this.validateResponse<T>(response, config);
    } catch (error) {
      this.logError("HTTP request failed", {
        error,
        url: config.url,
        method: config.method,
      });
      return this.handleRequestError<T>(error, config);
    }
  }

  /**
   * Executes request with retry logic
   * Business logic for retry behavior
   *
   * @param config - Complete request configuration
   * @returns Promise resolving to request result
   */
  private async executeWithRetry<T>(
    config: CompleteRequestConfig<T>,
  ): Promise<RequestResult<T>> {
    const retryStrategy = createRetryStrategy(config.retry!);
    let lastError: unknown;

    for (let attempt = 1; attempt <= config.retry!.attempts; attempt++) {
      try {
        this.logDebug(`Retry attempt ${attempt}/${config.retry!.attempts}`, {
          url: config.url,
          method: config.method,
        });

        const result = await this.executeSingleRequest(config);

        // If successful, return immediately
        if (result.status === RequestStatus.SUCCESS) {
          this.logDebug("Request succeeded on retry", {
            attempt,
            url: config.url,
            method: config.method,
          });
          return result;
        }

        // If error result, check if we should retry
        if (result.status === RequestStatus.ERROR) {
          // Create error object with proper type information
          const errorObj = new Error(result.message);
          (errorObj as unknown as Record<string, unknown>).type = result.type;
          (errorObj as unknown as Record<string, unknown>).code = result.code;
          lastError = errorObj;

          if (!retryStrategy.shouldRetry(attempt, lastError)) {
            this.logDebug("Retry condition not met", {
              attempt,
              errorType: result.type,
              url: config.url,
            });
            return result;
          }

          // Wait before retry
          if (attempt < config.retry!.attempts) {
            const delay = retryStrategy.getDelay(attempt);
            this.logDebug(`Waiting ${delay}ms before retry`, {
              attempt,
              delay,
            });
            await this.sleep(delay);
          }
        }
      } catch (error) {
        lastError = error;

        if (!retryStrategy.shouldRetry(attempt, error)) {
          this.logDebug("Retry condition not met for thrown error", {
            attempt,
            error: error instanceof Error ? error.message : String(error),
          });
          return this.handleRequestError<T>(error, config);
        }

        // Wait before retry
        if (attempt < config.retry!.attempts) {
          const delay = retryStrategy.getDelay(attempt);
          this.logDebug(`Waiting ${delay}ms before retry after error`, {
            attempt,
            delay,
          });
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    this.logError("All retry attempts exhausted", {
      attempts: config.retry!.attempts,
      url: config.url,
      method: config.method,
      lastError,
    });
    return this.handleRequestError<T>(lastError!, config);
  }

  /**
   * Validates response data using type guard
   * Pure business logic for validation
   *
   * @param response - HTTP response
   * @param config - Request configuration
   * @returns Request result with validated data or error
   */
  private validateResponse<T>(
    response: Record<string, unknown>,
    config: CompleteRequestConfig<T>,
  ): RequestResult<T> {
    const responseData = response.data;

    this.logDebug("Validating response data", {
      url: config.url,
      method: config.method,
      tolerance: config.tolerance,
    });

    if (config.tolerance) {
      // Tolerance mode - return data even if validation fails
      const { data, errors } = validateDataWithTolerance(
        responseData,
        config.guard,
        config.identifier,
      );

      if (errors.length > 0) {
        this.logWarn("Validation warnings in tolerance mode", {
          errors,
          url: config.url,
          method: config.method,
        });

        if (config.onError) {
          const context = createValidationContext(
            "validation",
            config.url,
            config.method,
            undefined,
            { errors, data: responseData },
          );
          config.onError(`Validation warnings: ${errors.join(", ")}`, context);
        }
      }

      return createSuccessResult<T>(data);
    } else {
      // Strict validation
      const { isValid, validatedData, errors } = validateData(
        responseData,
        config.guard,
        config.identifier,
      );

      if (isValid && validatedData) {
        return createSuccessResult<T>(validatedData);
      } else {
        const errorMessage =
          errors.length > 0
            ? `Response data validation failed: ${errors.join(", ")}`
            : "Response data validation failed";

        this.logError("Validation failed", {
          errors,
          url: config.url,
          method: config.method,
        });

        return createErrorResult<T>(500, errorMessage, "validation");
      }
    }
  }

  /**
   * Handles request errors with comprehensive error categorization
   *
   * @param error - Error that occurred
   * @param config - Request configuration
   * @returns Error result
   */
  private handleRequestError<T>(
    error: unknown,
    config: CompleteRequestConfig<T>,
  ): RequestResult<T> {
    const errorType = categorizeError(error);
    const message = extractErrorMessage(error);
    const statusCode = extractHttpStatusCode(error) || 500;

    const context = createErrorContext(error, config.url, config.method);

    if (this.shouldLogError(errorType, statusCode)) {
      this.logger.error(`Request failed: ${message}`, context);
    }

    return createErrorResult<T>(statusCode, message, errorType);
  }

  /**
   * Handles unexpected errors
   * Business logic for unexpected error handling
   *
   * @param error - Unexpected error
   * @param config - Request configuration
   * @returns Error result
   */
  private handleUnexpectedError<T>(
    error: unknown,
    config: CompleteRequestConfig<T>,
  ): RequestResult<T> {
    const message = extractErrorMessage(error);
    this.logger.error(`Unexpected error: ${message}`, { config, error });

    return createErrorResult<T>(500, message, "unknown");
  }

  /**
   * Validates request configuration
   *
   * @param config - Configuration to validate
   * @returns Error message if invalid, null if valid
   */
  private validateConfiguration<T>(
    config: CompleteRequestConfig<T>,
  ): string | null {
    // Validate basic request config
    const requestError = validateRequestConfig(config);
    if (requestError) {
      return requestError;
    }

    // Validate retry config if present
    if (config.retry) {
      const retryError = validateRetryConfig(config.retry);
      if (retryError) {
        return retryError;
      }
    }

    return null;
  }

  /**
   * Prepares HTTP configuration for axios
   *
   * @param config - Request configuration
   * @returns HTTP configuration object
   */
  private prepareHttpConfig<T>(
    config: CompleteRequestConfig<T>,
  ): Record<string, unknown> {
    const httpConfig: Record<string, unknown> = {
      url: config.url,
      method: config.method,
      timeout: config.timeout || this.defaultTimeout,
    };

    if (config.data !== undefined) {
      httpConfig.data = config.data;
    }

    if (config.headers) {
      httpConfig.headers = { ...config.headers };
    }

    if (config.baseURL) {
      httpConfig.baseURL = config.baseURL;
    }

    return httpConfig;
  }

  /**
   * Determines if error should be logged based on type and status
   *
   * @param errorType - Type of error
   * @param statusCode - HTTP status code
   * @returns Whether error should be logged
   */
  private shouldLogError(errorType: ErrorType, statusCode: number): boolean {
    // Always log validation and unknown errors
    if (errorType === "validation" || errorType === "unknown") {
      return true;
    }

    // Log network and timeout errors
    if (errorType === "network" || errorType === "timeout") {
      return true;
    }

    // Log HTTP 5xx errors
    if (statusCode >= 500) {
      return true;
    }

    return false;
  }

  /**
   * Sleep utility for retry delays
   *
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Creates default logger implementation
   *
   * @returns Default logger instance
   */
  private createDefaultLogger(): Logger {
    return {
      error: (message: string, context?: unknown): void => {
        console.error(`[ERROR] ${message}`, context);
      },
      warn: (message: string, context?: unknown): void => {
        console.warn(`[WARN] ${message}`, context);
      },
      info: (message: string, context?: unknown): void => {
        console.info(`[INFO] ${message}`, context);
      },
      debug: (message: string, context?: unknown): void => {
        if (this.enableDebugLogging) {
          console.debug(`[DEBUG] ${message}`, context);
        }
      },
    };
  }

  /**
   * Logs debug messages if debug logging is enabled
   *
   * @param message - Debug message
   * @param context - Debug context
   */
  private logDebug(message: string, context?: unknown): void {
    if (this.enableDebugLogging) {
      this.logger.debug(message, context);
    }
  }

  /**
   * Logs error messages
   *
   * @param message - Error message
   * @param context - Error context
   */
  private logError(message: string, context?: unknown): void {
    this.logger.error(message, context);
  }

  /**
   * Logs warning messages
   *
   * @param message - Warning message
   * @param context - Warning context
   */
  private logWarn(message: string, context?: unknown): void {
    this.logger.warn(message, context);
  }
}
