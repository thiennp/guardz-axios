import type { AxiosInstance } from "axios";
import type { TypeGuardFn } from "guardz";
import type { ErrorContext } from "./ErrorContext";
import type { RetryConfig } from "./RetryConfig";

/**
 * Professional safe request configuration
 */
export interface SafeRequestConfig<T> {
  /** Type guard function to validate response data */
  guard: TypeGuardFn<T>;
  /** Enable tolerance mode (default: false) */
  tolerance?: boolean;
  /** Identifier for error context (default: URL) */
  identifier?: string;
  /** Callback for type validation mismatches - only used in tolerance mode */
  onTypeMismatch?: (error: string, context: ErrorContext) => void;
  /** Custom axios instance */
  axiosInstance?: AxiosInstance;
  /** Validate response structure */
  validateResponse?: boolean;
  /** Retry configuration */
  retry?: RetryConfig;
  /** Timeout in milliseconds */
  timeout?: number;
}
