/**
 * Retry Utils Tests
 * Comprehensive tests for all retry utility functions
 */

import {
  calculateRetryDelay,
  shouldRetry,
  isRetryableError,
  createRetryConfig,
  validateRetryConfig,
  mergeRetryConfigs,
  createRetryStrategy,
} from "../../utils/retry-utils";
import { RetryConfig } from "../../domain/types";

describe("Retry Utils", () => {
  describe("calculateRetryDelay", () => {
    it("should calculate exponential backoff correctly", () => {
      const baseDelay = 1000;

      expect(calculateRetryDelay(1, baseDelay, "exponential")).toBe(1000);
      expect(calculateRetryDelay(2, baseDelay, "exponential")).toBe(2000);
      expect(calculateRetryDelay(3, baseDelay, "exponential")).toBe(4000);
      expect(calculateRetryDelay(4, baseDelay, "exponential")).toBe(8000);
    });

    it("should calculate linear backoff correctly", () => {
      const baseDelay = 1000;

      expect(calculateRetryDelay(1, baseDelay, "linear")).toBe(1000);
      expect(calculateRetryDelay(2, baseDelay, "linear")).toBe(2000);
      expect(calculateRetryDelay(3, baseDelay, "linear")).toBe(3000);
      expect(calculateRetryDelay(4, baseDelay, "linear")).toBe(4000);
    });

    it("should handle zero base delay", () => {
      expect(calculateRetryDelay(1, 0, "exponential")).toBe(0);
      expect(calculateRetryDelay(2, 0, "linear")).toBe(0);
    });

    it("should handle negative attempt numbers", () => {
      expect(calculateRetryDelay(0, 1000, "exponential")).toBe(0);
      expect(calculateRetryDelay(-1, 1000, "linear")).toBe(0);
    });
  });

  describe("shouldRetry", () => {
    it("should return false when max attempts reached", () => {
      const result = shouldRetry(3, 3, new Error("Test error"));
      expect(result).toBe(false);
    });

    it("should return true when attempts remaining", () => {
      const result = shouldRetry(1, 3, new Error("Test error"));
      expect(result).toBe(true);
    });

    it("should use custom retry function when provided", () => {
      const customRetryOn = jest.fn().mockReturnValue(false);
      const result = shouldRetry(1, 3, new Error("Test error"), customRetryOn);

      expect(result).toBe(false);
      expect(customRetryOn).toHaveBeenCalledWith(new Error("Test error"));
    });

    it("should use default retry logic when no custom function", () => {
      const networkError = new Error("Network Error");
      (networkError as any).code = "ECONNABORTED";

      const result = shouldRetry(1, 3, networkError);
      expect(result).toBe(true);
    });

    it("should not retry when custom function returns false", () => {
      const customRetryOn = jest.fn().mockReturnValue(false);
      const result = shouldRetry(1, 3, new Error("Test error"), customRetryOn);

      expect(result).toBe(false);
    });
  });

  describe("isRetryableError", () => {
    it("should identify network errors as retryable", () => {
      const networkErrors = [
        { code: "ECONNABORTED" },
        { code: "ENOTFOUND" },
        { code: "ECONNREFUSED" },
        { code: "ETIMEDOUT" },
        { code: "ERR_NETWORK" },
      ];

      networkErrors.forEach((error) => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    it("should identify HTTP 5xx errors as retryable", () => {
      const httpErrors = [
        { response: { status: 500 } },
        { response: { status: 502 } },
        { response: { status: 503 } },
        { response: { status: 504 } },
        { response: { status: 599 } },
      ];

      httpErrors.forEach((error) => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    it("should identify timeout errors as retryable", () => {
      const timeoutErrors = [
        { message: "timeout of 5000ms exceeded" },
        { message: "Request timeout" },
        { message: "Connection timeout" },
      ];

      timeoutErrors.forEach((error) => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    it("should not identify HTTP 4xx errors as retryable", () => {
      const httpErrors = [
        { response: { status: 400 } },
        { response: { status: 401 } },
        { response: { status: 403 } },
        { response: { status: 404 } },
        { response: { status: 422 } },
      ];

      httpErrors.forEach((error) => {
        expect(isRetryableError(error)).toBe(false);
      });
    });

    it("should not identify non-retryable errors", () => {
      const nonRetryableErrors = [
        null,
        undefined,
        "string error",
        123,
        { message: "Validation error" },
        { code: "VALIDATION_ERROR" },
      ];

      nonRetryableErrors.forEach((error) => {
        expect(isRetryableError(error)).toBe(false);
      });
    });
  });

  describe("createRetryConfig", () => {
    it("should create retry config with defaults", () => {
      const config = createRetryConfig();

      expect(config).toEqual({
        attempts: 3,
        delay: 1000,
        backoff: "exponential",
      });
    });

    it("should create retry config with custom values", () => {
      const customRetryOn = jest.fn();
      const config = createRetryConfig(5, 2000, "linear", customRetryOn);

      expect(config).toEqual({
        attempts: 5,
        delay: 2000,
        backoff: "linear",
        retryOn: customRetryOn,
      });
    });

    it("should handle partial custom values", () => {
      const config = createRetryConfig(5);

      expect(config).toEqual({
        attempts: 5,
        delay: 1000,
        backoff: "exponential",
      });
    });
  });

  describe("validateRetryConfig", () => {
    it("should return null for valid configuration", () => {
      const config = createRetryConfig();
      const result = validateRetryConfig(config);
      expect(result).toBeNull();
    });

    it("should return error for attempts less than 1", () => {
      const config = { ...createRetryConfig(), attempts: 0 };
      const result = validateRetryConfig(config);
      expect(result).toBe("Attempts must be at least 1");
    });

    it("should return error for negative delay", () => {
      const config = { ...createRetryConfig(), delay: -1000 };
      const result = validateRetryConfig(config);
      expect(result).toBe("Delay must be non-negative");
    });

    it("should return error for invalid backoff", () => {
      const config = { ...createRetryConfig(), backoff: "invalid" as any };
      const result = validateRetryConfig(config);
      expect(result).toBe('Backoff must be either "linear" or "exponential"');
    });

    it("should accept valid backoff values", () => {
      const linearConfig = {
        ...createRetryConfig(),
        backoff: "linear" as const,
      };
      const exponentialConfig = {
        ...createRetryConfig(),
        backoff: "exponential" as const,
      };

      expect(validateRetryConfig(linearConfig)).toBeNull();
      expect(validateRetryConfig(exponentialConfig)).toBeNull();
    });
  });

  describe("mergeRetryConfigs", () => {
    it("should merge retry configurations", () => {
      const base = createRetryConfig(3, 1000, "exponential");
      const override = {
        attempts: 5,
        delay: 2000,
      };

      const merged = mergeRetryConfigs(base, override);

      expect(merged).toEqual({
        attempts: 5,
        delay: 2000,
        backoff: "exponential",
      });
    });

    it("should preserve base config when no override", () => {
      const base = createRetryConfig(3, 1000, "exponential");
      const merged = mergeRetryConfigs(base, {});

      expect(merged).toEqual(base);
    });

    it("should override all properties", () => {
      const base = createRetryConfig(3, 1000, "exponential");
      const customRetryOn = jest.fn();
      const override = {
        attempts: 5,
        delay: 2000,
        backoff: "linear" as const,
        retryOn: customRetryOn,
      };

      const merged = mergeRetryConfigs(base, override);

      expect(merged).toEqual(override);
    });
  });

  describe("createRetryStrategy", () => {
    it("should create retry strategy with shouldRetry function", () => {
      const config = createRetryConfig(3, 1000, "exponential");
      const strategy = createRetryStrategy(config);

      expect(typeof strategy.shouldRetry).toBe("function");
      expect(typeof strategy.getDelay).toBe("function");
    });

    it("should use custom retry function when provided", () => {
      const customRetryOn = jest.fn().mockReturnValue(true);
      const config = createRetryConfig(3, 1000, "exponential", customRetryOn);
      const strategy = createRetryStrategy(config);

      const result = strategy.shouldRetry(1, new Error("Test error"));

      expect(result).toBe(true);
      expect(customRetryOn).toHaveBeenCalledWith(new Error("Test error"));
    });

    it("should calculate delays correctly", () => {
      const config = createRetryConfig(3, 1000, "exponential");
      const strategy = createRetryStrategy(config);

      expect(strategy.getDelay(1)).toBe(1000);
      expect(strategy.getDelay(2)).toBe(2000);
      expect(strategy.getDelay(3)).toBe(4000);
    });

    it("should handle linear backoff in strategy", () => {
      const config = createRetryConfig(3, 1000, "linear");
      const strategy = createRetryStrategy(config);

      expect(strategy.getDelay(1)).toBe(1000);
      expect(strategy.getDelay(2)).toBe(2000);
      expect(strategy.getDelay(3)).toBe(3000);
    });
  });
});
