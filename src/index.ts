// ===============================
// Core Type Definitions
// ===============================
export * from "./types/axios-types";

// ===============================
// Type Guards
// ===============================
export * from "./guards/axios-response-guards";
export * from "./guards/axios-error-guards";
export * from "./guards/status-guards";

// ===============================
// Utilities
// ===============================
export {
  safeExtractData,
  extractPaginatedData,
  handleAxiosError,
  createResponseValidator,
  defaultRetryCondition,
  calculateBackoffDelay,
  shouldTriggerAuth,
  extractErrorMessage,
} from "./utils/axios-utils";

// ===============================
// Domain Types
// ===============================
export * from "./domain/types";

// ===============================
// Utilities
// ===============================
export * from "./utils/request-utils";
export * from "./utils/validation-utils";
export * from "./utils/retry-utils";
export * from "./utils/error-utils";

// ===============================
// Services
// ===============================
export * from "./services/request-service";

// ===============================
// Unified API
// ===============================
export * from "./api/unified-api";

// ===============================
// Legacy API (for backward compatibility)
// ===============================
// Note: Legacy exports are available through individual imports if needed
// import { safeExtractData } from './utils/axios-utils';
