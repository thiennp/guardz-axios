/**
 * Error Utils Tests
 * Comprehensive tests for all error utility functions
 */

import {
  categorizeError,
  extractErrorMessage,
  extractHttpStatusCode,
  createStandardErrorMessage,
  formatErrorForLogging,
  shouldLogError,
  createErrorContext,
} from "../../utils/error-utils";
import { ErrorType } from "../../domain/types";

describe("Error Utils", () => {
  describe("categorizeError", () => {
    it("should categorize network errors", () => {
      const networkErrors = [
        { code: "ECONNABORTED" },
        { code: "ENOTFOUND" },
        { code: "ECONNREFUSED" },
        { code: "ERR_NETWORK" },
      ];

      networkErrors.forEach((error) => {
        expect(categorizeError(error)).toBe("network");
      });
    });

    it("should categorize timeout errors", () => {
      const timeoutErrors = [
        { code: "ETIMEDOUT" },
        { message: "timeout of 5000ms exceeded" },
        { message: "Request timeout" },
      ];

      timeoutErrors.forEach((error) => {
        expect(categorizeError(error)).toBe("timeout");
      });
    });

    it("should categorize HTTP errors", () => {
      const httpErrors = [
        { response: { status: 400 } },
        { response: { status: 404 } },
        { response: { status: 500 } },
      ];

      httpErrors.forEach((error) => {
        expect(categorizeError(error)).toBe("http");
      });
    });

    it("should categorize validation errors", () => {
      const validationErrors = [
        { message: "validation failed" },
        { message: "Validation error" },
        { message: "Data validation error" },
      ];

      validationErrors.forEach((error) => {
        expect(categorizeError(error)).toBe("validation");
      });
    });

    it("should categorize unknown errors", () => {
      const unknownErrors = [
        null,
        undefined,
        "string error",
        123,
        { message: "Some other error" },
        { code: "UNKNOWN_ERROR" },
      ];

      unknownErrors.forEach((error) => {
        expect(categorizeError(error)).toBe("unknown");
      });
    });
  });

  describe("extractErrorMessage", () => {
    it("should extract message from Error objects", () => {
      const error = new Error("Test error message");
      expect(extractErrorMessage(error)).toBe("Test error message");
    });

    it("should extract message from objects with message property", () => {
      const error = { message: "Custom error message" };
      expect(extractErrorMessage(error)).toBe("Custom error message");
    });

    it("should extract message from objects with error property", () => {
      const error = { error: "Error property message" };
      expect(extractErrorMessage(error)).toBe("Error property message");
    });

    it("should use toString for objects without message or error", () => {
      const error = { toString: () => "ToString message" };
      expect(extractErrorMessage(error)).toBe("ToString message");
    });

    it("should handle string errors", () => {
      expect(extractErrorMessage("String error")).toBe("String error");
    });

    it("should handle null and undefined", () => {
      expect(extractErrorMessage(null)).toBe("Unknown error");
      expect(extractErrorMessage(undefined)).toBe("Unknown error");
    });

    it("should handle primitive values", () => {
      expect(extractErrorMessage(123)).toBe("Unknown error");
      expect(extractErrorMessage(true)).toBe("Unknown error");
    });
  });

  describe("extractHttpStatusCode", () => {
    it("should extract status from response object", () => {
      const error = { response: { status: 404 } };
      expect(extractHttpStatusCode(error)).toBe(404);
    });

    it("should extract status from status property", () => {
      const error = { status: 500 };
      expect(extractHttpStatusCode(error)).toBe(500);
    });

    it("should extract status from statusCode property", () => {
      const error = { statusCode: 403 };
      expect(extractHttpStatusCode(error)).toBe(403);
    });

    it("should return undefined for non-HTTP errors", () => {
      const errors = [
        null,
        undefined,
        "string error",
        { message: "Network error" },
        { code: "ECONNABORTED" },
      ];

      errors.forEach((error) => {
        expect(extractHttpStatusCode(error)).toBeUndefined();
      });
    });

    it("should prioritize response.status over other properties", () => {
      const error = {
        response: { status: 404 },
        status: 500,
        statusCode: 403,
      };
      expect(extractHttpStatusCode(error)).toBe(404);
    });
  });

  describe("createStandardErrorMessage", () => {
    it("should create network error message", () => {
      const message = createStandardErrorMessage(
        "network",
        "Connection failed",
        0,
      );
      expect(message).toBe("Network Error: Connection failed");
    });

    it("should create timeout error message", () => {
      const message = createStandardErrorMessage(
        "timeout",
        "Request timed out",
        0,
      );
      expect(message).toBe("Timeout Error: Request timed out");
    });

    it("should create HTTP error message with status code", () => {
      const message = createStandardErrorMessage("http", "Not Found", 404);
      expect(message).toBe("HTTP 404: Not Found");
    });

    it("should create HTTP error message without status code", () => {
      const message = createStandardErrorMessage("http", "Server Error");
      expect(message).toBe("HTTP Error: Server Error");
    });

    it("should create validation error message", () => {
      const message = createStandardErrorMessage("validation", "Invalid data");
      expect(message).toBe("Validation Error: Invalid data");
    });

    it("should return original message for unknown type", () => {
      const message = createStandardErrorMessage("unknown", "Some error");
      expect(message).toBe("Some error");
    });
  });

  describe("formatErrorForLogging", () => {
    it("should format error with context", () => {
      const error = { message: "Network error", code: "ECONNABORTED" };
      const context = {
        type: "network" as ErrorType,
        url: "https://api.example.com",
        method: "GET" as any,
        statusCode: 500,
      };

      const formatted = formatErrorForLogging(error, context);
      expect(formatted).toContain("Network Error: Network error");
      expect(formatted).toContain("URL: https://api.example.com");
      expect(formatted).toContain("Method: GET");
      expect(formatted).toContain("Status: 500");
    });

    it("should format error without context", () => {
      const error = { message: "Test error" };
      const formatted = formatErrorForLogging(error);
      expect(formatted).toBe("Test error");
    });

    it("should format error with partial context", () => {
      const error = { message: "Validation error" };
      const context = {
        type: "validation" as ErrorType,
        url: "https://api.example.com",
        method: "POST" as any,
      };

      const formatted = formatErrorForLogging(error, context);
      expect(formatted).toContain("Validation Error: Validation error");
      expect(formatted).toContain("URL: https://api.example.com");
      expect(formatted).toContain("Method: POST");
      expect(formatted).not.toContain("Status:");
    });
  });

  describe("shouldLogError", () => {
    it("should log validation errors", () => {
      const error = { message: "validation failed" };
      expect(shouldLogError(error)).toBe(true);
    });

    it("should log unknown errors", () => {
      const error = { message: "unknown error" };
      expect(shouldLogError(error)).toBe(true);
    });

    it("should log network errors", () => {
      const error = { code: "ECONNABORTED" };
      expect(shouldLogError(error)).toBe(true);
    });

    it("should log timeout errors", () => {
      const error = { code: "ETIMEDOUT" };
      expect(shouldLogError(error)).toBe(true);
    });

    it("should log HTTP 5xx errors", () => {
      const errors = [
        { response: { status: 500 } },
        { response: { status: 502 } },
        { response: { status: 503 } },
        { response: { status: 599 } },
      ];

      errors.forEach((error) => {
        expect(shouldLogError(error)).toBe(true);
      });
    });

    it("should not log HTTP 4xx errors", () => {
      const errors = [
        { response: { status: 400 } },
        { response: { status: 401 } },
        { response: { status: 403 } },
        { response: { status: 404 } },
        { response: { status: 422 } },
      ];

      errors.forEach((error) => {
        expect(shouldLogError(error)).toBe(false);
      });
    });

    it("should not log HTTP 2xx/3xx errors", () => {
      const errors = [
        { response: { status: 200 } },
        { response: { status: 201 } },
        { response: { status: 301 } },
        { response: { status: 302 } },
      ];

      errors.forEach((error) => {
        expect(shouldLogError(error)).toBe(false);
      });
    });
  });

  describe("createErrorContext", () => {
    it("should create error context from error object", () => {
      const error = {
        message: "Network error",
        code: "ECONNABORTED",
        response: { status: 500 },
      };

      const context = createErrorContext(
        error,
        "https://api.example.com",
        "POST",
      );

      expect(context).toEqual({
        type: "network",
        url: "https://api.example.com",
        method: "POST",
        statusCode: 500,
        originalError: error,
      });
    });

    it("should create error context without status code", () => {
      const error = { message: "Validation error" };
      const context = createErrorContext(
        error,
        "https://api.example.com",
        "GET",
      );

      expect(context).toEqual({
        type: "validation",
        url: "https://api.example.com",
        method: "GET",
        statusCode: undefined,
        originalError: error,
      });
    });

    it("should categorize different error types correctly", () => {
      const testCases = [
        {
          error: { code: "ECONNABORTED" },
          expectedType: "network" as ErrorType,
        },
        { error: { code: "ETIMEDOUT" }, expectedType: "timeout" as ErrorType },
        {
          error: { response: { status: 404 } },
          expectedType: "http" as ErrorType,
        },
        {
          error: { message: "validation failed" },
          expectedType: "validation" as ErrorType,
        },
        {
          error: { message: "unknown error" },
          expectedType: "unknown" as ErrorType,
        },
      ];

      testCases.forEach(({ error, expectedType }) => {
        const context = createErrorContext(
          error,
          "https://api.example.com",
          "GET",
        );
        expect(context.type).toBe(expectedType);
      });
    });
  });
});
