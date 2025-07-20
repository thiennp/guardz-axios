/**
 * Axios Utils Tests
 * Comprehensive tests for all axios utility functions
 */

import {
  safeExtractData,
  extractPaginatedData,
  handleAxiosError,
  createResponseValidator,
  defaultRetryCondition,
  calculateBackoffDelay,
  shouldTriggerAuth,
  extractErrorMessage,
} from "../../utils/axios-utils";
import { isString, isNumber, isType } from "guardz";
import { AxiosResponse, AxiosError } from "axios";

// Mock type guards
const isUser = isType({
  id: isNumber,
  name: isString,
});

const isPaginatedResponse = isType({
  data: (value: unknown): value is any[] => Array.isArray(value),
  page: isNumber,
  total: isNumber,
  hasNext: (value: unknown): value is boolean => typeof value === "boolean",
});

describe("Axios Utils", () => {
  describe("safeExtractData", () => {
    it("should extract data from valid response", () => {
      const response: AxiosResponse = {
        data: { id: 1, name: "John" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
        request: {},
      };

      const result = safeExtractData(response, isUser);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ id: 1, name: "John" });
        expect(result.response).toBe(response);
      }
    });

    it("should fail on invalid response structure", () => {
      const invalidResponse = { data: { id: 1, name: "John" } };

      const result = safeExtractData(invalidResponse, isUser);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid Axios response structure");
      }
    });

    it("should fail on HTTP error status", () => {
      const response: AxiosResponse = {
        data: { id: 1, name: "John" },
        status: 404,
        statusText: "Not Found",
        headers: {},
        config: {} as any,
        request: {},
      };

      const result = safeExtractData(response, isUser);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("HTTP error: 404 Not Found");
      }
    });

    it("should fail on data validation error", () => {
      const response: AxiosResponse = {
        data: { id: "1", name: "John" }, // id should be number
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
        request: {},
      };

      const result = safeExtractData(response, isUser);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Response data does not match expected type");
      }
    });
  });

  describe("extractPaginatedData", () => {
    it("should extract paginated data successfully", () => {
      const response: AxiosResponse = {
        data: {
          data: [
            { id: 1, name: "John" },
            { id: 2, name: "Jane" },
          ],
          page: 1,
          total: 2,
          hasNext: false,
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
        request: {},
      };

      const result = extractPaginatedData(response, isUser);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([
          { id: 1, name: "John" },
          { id: 2, name: "Jane" },
        ]);
        expect(result.pagination).toEqual({
          page: 1,
          total: 2,
          hasNext: false,
        });
        expect(result.response).toBe(response);
      }
    });

    it("should fail on invalid paginated response", () => {
      const response: AxiosResponse = {
        data: { items: [{ id: 1, name: "John" }] }, // Wrong structure
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
        request: {},
      };

      const result = extractPaginatedData(response, isUser);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Response data does not match expected type");
      }
    });
  });

  describe("handleAxiosError", () => {
    it("should handle network errors", () => {
      const networkError = new Error("Network Error") as AxiosError;
      networkError.isAxiosError = true;
      networkError.name = "AxiosError";
      networkError.code = "ENOTFOUND";

      const result = handleAxiosError(networkError);

      expect(result.category).toBe("network");
      expect(result.message).toBe(
        "Network error - please check your connection",
      );
      expect(result.isRetryable).toBe(true);
    });

    it("should handle timeout errors", () => {
      const timeoutError = new Error(
        "timeout of 5000ms exceeded",
      ) as AxiosError;
      timeoutError.isAxiosError = true;
      timeoutError.name = "AxiosError";
      timeoutError.code = "ETIMEDOUT";

      const result = handleAxiosError(timeoutError);

      expect(result.category).toBe("timeout");
      expect(result.message).toBe("Request timeout - please try again");
      expect(result.isRetryable).toBe(true);
    });

    it("should handle cancel errors", () => {
      const cancelError = new Error("Request cancelled") as AxiosError;
      cancelError.isAxiosError = true;
      cancelError.name = "AxiosError";
      cancelError.code = "ERR_CANCELED";

      const result = handleAxiosError(cancelError);

      expect(result.category).toBe("cancel");
      expect(result.message).toBe("Request was cancelled");
      expect(result.isRetryable).toBe(false);
    });

    it("should handle client errors", () => {
      const clientError = new Error("Bad Request") as AxiosError;
      clientError.isAxiosError = true;
      clientError.name = "AxiosError";
      clientError.response = {
        status: 400,
        statusText: "Bad Request",
        data: {},
        headers: {},
        config: {} as any,
      };

      const result = handleAxiosError(clientError);

      expect(result.category).toBe("client");
      expect(result.statusCode).toBe(400);
      expect(result.isRetryable).toBe(false);
    });

    it("should handle rate limit errors as retryable", () => {
      const rateLimitError = new Error("Too Many Requests") as AxiosError;
      rateLimitError.isAxiosError = true;
      rateLimitError.name = "AxiosError";
      rateLimitError.response = {
        status: 429,
        statusText: "Too Many Requests",
        data: {},
        headers: {},
        config: {} as any,
      };

      const result = handleAxiosError(rateLimitError);

      expect(result.category).toBe("client");
      expect(result.statusCode).toBe(429);
      expect(result.isRetryable).toBe(true);
    });

    it("should handle server errors", () => {
      const serverError = new Error("Internal Server Error") as AxiosError;
      serverError.isAxiosError = true;
      serverError.name = "AxiosError";
      serverError.response = {
        status: 500,
        statusText: "Internal Server Error",
        data: {},
        headers: {},
        config: {} as any,
      };

      const result = handleAxiosError(serverError);

      expect(result.category).toBe("server");
      expect(result.statusCode).toBe(500);
      expect(result.isRetryable).toBe(true);
    });

    it("should handle unknown errors", () => {
      const unknownError = new Error("Unknown error");

      const result = handleAxiosError(unknownError);

      expect(result.category).toBe("unknown");
      expect(result.message).toBe("Unknown error");
      expect(result.isRetryable).toBe(false);
    });
  });

  describe("createResponseValidator", () => {
    it("should create validator with defaults", () => {
      const validator = createResponseValidator(isUser);

      const response: AxiosResponse = {
        data: { id: 1, name: "John" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
        request: {},
      };

      const result = validator(response);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ id: 1, name: "John" });
      }
    });

    it("should validate custom status codes", () => {
      const validator = createResponseValidator(isUser, {
        allowedStatuses: [201, 202],
      });

      const response: AxiosResponse = {
        data: { id: 1, name: "John" },
        status: 201,
        statusText: "Created",
        headers: {},
        config: {} as any,
        request: {},
      };

      const result = validator(response);

      expect(result.success).toBe(true);
    });

    it("should fail on disallowed status codes", () => {
      const validator = createResponseValidator(isUser, {
        allowedStatuses: [200],
      });

      const response: AxiosResponse = {
        data: { id: 1, name: "John" },
        status: 201,
        statusText: "Created",
        headers: {},
        config: {} as any,
        request: {},
      };

      const result = validator(response);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.statusCode).toBe(201);
      }
    });

    it("should use custom error messages", () => {
      const validator = createResponseValidator(isUser, {
        allowedStatuses: [200],
        customErrorMessages: { 404: "User not found" },
      });

      const response: AxiosResponse = {
        data: { id: 1, name: "John" },
        status: 404,
        statusText: "Not Found",
        headers: {},
        config: {} as any,
        request: {},
      };

      const result = validator(response);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
      }
    });

    it("should validate content type", () => {
      const validator = createResponseValidator(isUser, {
        validateContentType: "application/json",
      });

      const response: AxiosResponse = {
        data: { id: 1, name: "John" },
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        config: {} as any,
        request: {},
      };

      const result = validator(response);

      expect(result.success).toBe(true);
    });

    it("should fail on wrong content type", () => {
      const validator = createResponseValidator(isUser, {
        validateContentType: "application/json",
      });

      const response: AxiosResponse = {
        data: { id: 1, name: "John" },
        status: 200,
        statusText: "OK",
        headers: { "content-type": "text/plain" },
        config: {} as any,
        request: {},
      };

      const result = validator(response);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Expected content type");
      }
    });
  });

  describe("defaultRetryCondition", () => {
    it("should retry on network errors", () => {
      const networkError = new Error("Network Error") as AxiosError;
      networkError.isAxiosError = true;
      networkError.name = "AxiosError";
      networkError.code = "ENOTFOUND";

      const result = defaultRetryCondition(networkError);

      expect(result).toBe(true);
    });

    it("should retry on timeout errors", () => {
      const timeoutError = new Error("timeout") as AxiosError;
      timeoutError.isAxiosError = true;
      timeoutError.name = "AxiosError";
      timeoutError.code = "ETIMEDOUT";

      const result = defaultRetryCondition(timeoutError);

      expect(result).toBe(true);
    });

    it("should retry on 5xx errors", () => {
      const serverError = new Error("Server Error") as AxiosError;
      serverError.isAxiosError = true;
      serverError.name = "AxiosError";
      serverError.response = {
        status: 500,
        statusText: "Internal Server Error",
        data: {},
        headers: {},
        config: {} as any,
      };

      const result = defaultRetryCondition(serverError);

      expect(result).toBe(true);
    });

    it("should retry on 429 errors", () => {
      const rateLimitError = new Error("Too Many Requests") as AxiosError;
      rateLimitError.isAxiosError = true;
      rateLimitError.name = "AxiosError";
      rateLimitError.response = {
        status: 429,
        statusText: "Too Many Requests",
        data: {},
        headers: {},
        config: {} as any,
      };

      const result = defaultRetryCondition(rateLimitError);

      expect(result).toBe(true);
    });

    it("should not retry on 4xx errors", () => {
      const clientError = new Error("Bad Request") as AxiosError;
      clientError.isAxiosError = true;
      clientError.name = "AxiosError";
      clientError.response = {
        status: 400,
        statusText: "Bad Request",
        data: {},
        headers: {},
        config: {} as any,
      };

      const result = defaultRetryCondition(clientError);

      expect(result).toBe(false);
    });
  });

  describe("calculateBackoffDelay", () => {
    it("should calculate exponential backoff", () => {
      expect(calculateBackoffDelay(1, 1000, 10000)).toBe(1000);
      expect(calculateBackoffDelay(2, 1000, 10000)).toBe(2000);
      expect(calculateBackoffDelay(3, 1000, 10000)).toBe(4000);
      expect(calculateBackoffDelay(4, 1000, 10000)).toBe(8000);
    });

    it("should respect max delay", () => {
      expect(calculateBackoffDelay(10, 1000, 5000)).toBe(5000);
    });
  });

  describe("shouldTriggerAuth", () => {
    it("should trigger auth on 401", () => {
      const authError = new Error("Unauthorized") as AxiosError;
      authError.isAxiosError = true;
      authError.name = "AxiosError";
      authError.response = {
        status: 401,
        statusText: "Unauthorized",
        data: {},
        headers: {},
        config: {} as any,
      };

      const result = shouldTriggerAuth(authError);

      expect(result).toBe(true);
    });

    it("should trigger auth on 403", () => {
      const authError = new Error("Forbidden") as AxiosError;
      authError.isAxiosError = true;
      authError.name = "AxiosError";
      authError.response = {
        status: 403,
        statusText: "Forbidden",
        data: {},
        headers: {},
        config: {} as any,
      };

      const result = shouldTriggerAuth(authError);

      expect(result).toBe(true);
    });

    it("should not trigger auth on other errors", () => {
      const otherError = new Error("Not Found") as AxiosError;
      otherError.isAxiosError = true;
      otherError.name = "AxiosError";
      otherError.response = {
        status: 404,
        statusText: "Not Found",
        data: {},
        headers: {},
        config: {} as any,
      };

      const result = shouldTriggerAuth(otherError);

      expect(result).toBe(false);
    });

    it("should not trigger auth on non-axios errors", () => {
      const otherError = new Error("Some error");

      const result = shouldTriggerAuth(otherError);

      expect(result).toBe(false);
    });
  });

  describe("extractErrorMessage", () => {
    it("should extract message from Error objects", () => {
      const error = new Error("Test error message");
      const result = extractErrorMessage(error);
      expect(result).toBe("Test error message");
    });

    it("should extract message from AxiosError with response data", () => {
      const error = new Error("Axios error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.response = {
        data: { message: "Custom error message" },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as any,
      };
      const result = extractErrorMessage(error);
      expect(result).toBe("Custom error message");
    });

    it("should extract message from AxiosError with error property", () => {
      const error = new Error("Axios error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.response = {
        data: { error: "Error property message" },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as any,
      };
      const result = extractErrorMessage(error);
      expect(result).toBe("Error property message");
    });

    it("should extract string data from AxiosError", () => {
      const error = new Error("Axios error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.response = {
        data: "String error message",
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {} as any,
      };
      const result = extractErrorMessage(error);
      expect(result).toBe("String error message");
    });

    it("should fallback to error message for AxiosError", () => {
      const error = new Error("Axios error message") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      const result = extractErrorMessage(error);
      expect(result).toBe("Axios error message");
    });

    it("should handle null and undefined", () => {
      expect(extractErrorMessage(null)).toBe("An error occurred");
      expect(extractErrorMessage(undefined)).toBe("An error occurred");
    });

    it("should handle plain objects", () => {
      const error = { custom: "data" };
      const result = extractErrorMessage(error);
      expect(result).toBe("An error occurred");
    });

    it("should handle primitive values", () => {
      expect(extractErrorMessage(123)).toBe("An error occurred");
      expect(extractErrorMessage(true)).toBe("An error occurred");
      expect(extractErrorMessage("string")).toBe("An error occurred");
    });

    it("should use custom fallback", () => {
      const result = extractErrorMessage(null, "Custom fallback");
      expect(result).toBe("Custom fallback");
    });
  });
});
