import { TypeGuardFn, isType, isNumber } from "guardz";
import { AxiosResponse, AxiosError } from "axios";
import {
  isAxiosResponse,
  isSuccessResponse,
} from "@/guards/axios-response-guards";
import {
  isAxiosError,
  isNetworkError,
  isTimeoutError,
  categorizeAxiosError,
} from "@/guards/axios-error-guards";

/**
 * Safely extract data from Axios response with type validation
 */
export function safeExtractData<T>(
  response: unknown,
  dataGuard: TypeGuardFn<T>,
):
  | { success: true; data: T; response: AxiosResponse }
  | { success: false; error: string } {
  if (!isAxiosResponse(response)) {
    return { success: false, error: "Invalid Axios response structure" };
  }

  if (!isSuccessResponse(response)) {
    return {
      success: false,
      error: `HTTP error: ${response.status} ${response.statusText}`,
    };
  }

  if (!dataGuard(response.data)) {
    return {
      success: false,
      error: "Response data does not match expected type",
    };
  }

  return { success: true, data: response.data, response };
}

/**
 * Validate and extract paginated response data
 */
export function extractPaginatedData<T>(
  response: unknown,
  itemGuard: TypeGuardFn<T>,
):
  | {
      success: true;
      data: T[];
      pagination: { page: number; total: number; hasNext: boolean };
      response: AxiosResponse;
    }
  | { success: false; error: string } {
  const paginatedResponseGuard = isType<{
    data: T[];
    page: number;
    total: number;
    hasNext: boolean;
  }>({
    data: (value: unknown): value is T[] => {
      if (!Array.isArray(value)) return false;
      return value.every((item) => itemGuard(item));
    },
    page: isNumber,
    total: isNumber,
    hasNext: (value: unknown): value is boolean => typeof value === "boolean",
  });

  const extraction = safeExtractData(response, paginatedResponseGuard);

  if (!extraction.success) {
    return extraction;
  }

  return {
    success: true,
    data: extraction.data.data,
    pagination: {
      page: extraction.data.page,
      total: extraction.data.total,
      hasNext: extraction.data.hasNext,
    },
    response: extraction.response,
  };
}

/**
 * Handle Axios errors with detailed categorization
 */
export function handleAxiosError(error: unknown): {
  category: "network" | "timeout" | "cancel" | "client" | "server" | "unknown";
  message: string;
  statusCode?: number;
  errorCode?: string;
  isRetryable: boolean;
  details?: any;
} {
  const categorization = categorizeAxiosError(error);

  if (!categorization.isAxiosError) {
    return {
      category: "unknown",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
      isRetryable: false,
    };
  }

  const axiosError = error as AxiosError;

  let message = axiosError.message || "Axios error occurred";
  let isRetryable = false;

  switch (categorization.category) {
    case "network":
      message = "Network error - please check your connection";
      isRetryable = true;
      break;
    case "timeout":
      message = "Request timeout - please try again";
      isRetryable = true;
      break;
    case "cancel":
      message = "Request was cancelled";
      isRetryable = false;
      break;
    case "client":
      message = `Client error: ${categorization.statusCode} ${axiosError.response?.statusText || ""}`;
      isRetryable = categorization.statusCode === 429; // Rate limit
      break;
    case "server":
      message = `Server error: ${categorization.statusCode} ${axiosError.response?.statusText || ""}`;
      isRetryable = [500, 502, 503, 504].includes(
        categorization.statusCode || 0,
      );
      break;
    default:
      message = axiosError.message || "Unknown error occurred";
      isRetryable = false;
  }

  return {
    category: categorization.category,
    message,
    statusCode: categorization.statusCode,
    errorCode: categorization.errorCode,
    isRetryable,
    details: axiosError.response?.data,
  };
}

/**
 * Create a response validator with custom error messages
 */
export function createResponseValidator<T>(
  dataGuard: TypeGuardFn<T>,
  options: {
    allowedStatuses?: number[];
    customErrorMessages?: Record<number, string>;
    validateContentType?: string;
  } = {},
) {
  const {
    allowedStatuses = [200, 201],
    customErrorMessages = {},
    validateContentType,
  } = options;

  return function (response: unknown):
    | {
        success: true;
        data: T;
        response: AxiosResponse;
      }
    | {
        success: false;
        error: string;
        statusCode?: number;
      } {
    if (!isAxiosResponse(response)) {
      return { success: false, error: "Invalid response structure" };
    }

    if (!allowedStatuses.includes(response.status)) {
      const customMessage = customErrorMessages[response.status];
      return {
        success: false,
        error: customMessage || `Unexpected status code: ${response.status}`,
        statusCode: response.status,
      };
    }

    if (validateContentType) {
      const contentType =
        response.headers["content-type"] || response.headers["Content-Type"];
      if (!contentType || !contentType.includes(validateContentType)) {
        return {
          success: false,
          error: `Expected content type '${validateContentType}' but got '${contentType}'`,
        };
      }
    }

    if (!dataGuard(response.data)) {
      return {
        success: false,
        error: "Response data validation failed",
        statusCode: response.status,
      };
    }

    return {
      success: true,
      data: response.data,
      response,
    };
  };
}

/**
 * Retry configuration for Axios requests
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryCondition?: (error: unknown) => boolean;
}

/**
 * Default retry condition - retry on network errors, timeouts, and 5xx server errors
 */
export function defaultRetryCondition(error: unknown): boolean {
  if (isNetworkError(error) || isTimeoutError(error)) {
    return true;
  }

  if (isAxiosError(error) && error.response) {
    const status = error.response.status;
    return status >= 500 || status === 429; // Server errors or rate limiting
  }

  return false;
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
): number {
  const delay = baseDelay * Math.pow(2, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Utility to check if error should trigger authentication flow
 */
export function shouldTriggerAuth(error: unknown): boolean {
  if (!isAxiosError(error) || !error.response) {
    return false;
  }

  return error.response.status === 401 || error.response.status === 403;
}

/**
 * Extract error message from Axios error
 */
export function extractErrorMessage(
  error: unknown,
  fallback = "An error occurred",
): string {
  if (isAxiosError(error)) {
    // Try to extract message from response data
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === "string") return data;
      if (typeof data === "object" && data !== null) {
        const obj = data as Record<string, unknown>;
        if (typeof obj.message === "string") return obj.message;
        if (typeof obj.error === "string") return obj.error;
      }
    }

    // Fallback to error message
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
