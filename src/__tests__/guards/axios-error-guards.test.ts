/**
 * Axios Error Guards Tests
 * Comprehensive tests for all axios error guard functions
 */

import {
  isAxiosError,
  isAxiosErrorWithResponse,
  isNetworkError,
  isTimeoutError,
  isCancelError,
  isClientError,
  isServerError,
  isAuthenticationError,
  isAuthorizationError,
  isNotFoundError,
  isValidationError,
  isRateLimitError,
  isErrorWithStatus,
  isErrorWithCode,
  categorizeAxiosError,
} from "../../guards/axios-error-guards";
import { AxiosError, AxiosResponse } from "axios";

describe("Axios Error Guards", () => {
  describe("isAxiosError", () => {
    it("should identify valid AxiosError", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";

      expect(isAxiosError(error)).toBe(true);
    });

    it("should reject non-object values", () => {
      expect(isAxiosError(null)).toBe(false);
      expect(isAxiosError(undefined)).toBe(false);
      expect(isAxiosError("string")).toBe(false);
      expect(isAxiosError(123)).toBe(false);
    });

    it("should reject objects without required properties", () => {
      const invalidError = { message: "Test error" };
      expect(isAxiosError(invalidError)).toBe(false);
    });

    it("should reject objects with wrong property types", () => {
      const invalidError = {
        message: 123, // Should be string
        name: "AxiosError",
        isAxiosError: true,
      };
      expect(isAxiosError(invalidError)).toBe(false);
    });

    it("should handle optional properties correctly", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";
      error.response = undefined;
      error.config = undefined;
      error.code = undefined;

      expect(isAxiosError(error)).toBe(true);
    });

    it("should validate optional response property", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";
      error.response = "invalid" as any; // Should be object or undefined

      expect(isAxiosError(error)).toBe(false);
    });
  });

  describe("isAxiosErrorWithResponse", () => {
    it("should identify AxiosError with response", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";
      error.response = {} as AxiosResponse;

      expect(isAxiosErrorWithResponse(error)).toBe(true);
    });

    it("should reject AxiosError without response", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";
      error.response = undefined;

      expect(isAxiosErrorWithResponse(error)).toBe(false);
    });

    it("should reject non-AxiosError", () => {
      const error = new Error("Test error");
      expect(isAxiosErrorWithResponse(error)).toBe(false);
    });
  });

  describe("isNetworkError", () => {
    it("should identify network errors", () => {
      const networkCodes = ["ENOTFOUND", "ECONNREFUSED", "ERR_NETWORK"];

      networkCodes.forEach((code) => {
        const error = new Error("Network error") as AxiosError;
        error.isAxiosError = true;
        error.name = "AxiosError";
        error.message = "Network error";
        error.code = code;

        expect(isNetworkError(error)).toBe(true);
      });
    });

    it("should reject non-network errors", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";
      error.code = "OTHER_CODE";

      expect(isNetworkError(error)).toBe(false);
    });

    it("should reject errors without code", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";

      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe("isTimeoutError", () => {
    it("should identify timeout errors", () => {
      const timeoutCodes = ["ECONNABORTED", "ETIMEDOUT"];

      timeoutCodes.forEach((code) => {
        const error = new Error("Timeout error") as AxiosError;
        error.isAxiosError = true;
        error.name = "AxiosError";
        error.message = "Timeout error";
        error.code = code;

        expect(isTimeoutError(error)).toBe(true);
      });
    });

    it("should reject non-timeout errors", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";
      error.code = "OTHER_CODE";

      expect(isTimeoutError(error)).toBe(false);
    });
  });

  describe("isCancelError", () => {
    it("should identify cancel errors", () => {
      const error = new Error("Request cancelled") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Request cancelled";
      error.code = "ERR_CANCELED";

      expect(isCancelError(error)).toBe(true);
    });

    it("should reject non-cancel errors", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";
      error.code = "OTHER_CODE";

      expect(isCancelError(error)).toBe(false);
    });
  });

  describe("isClientError", () => {
    it("should identify client errors (4xx)", () => {
      const clientStatuses = [400, 401, 403, 404, 422, 429];

      clientStatuses.forEach((status) => {
        const error = new Error("Client error") as AxiosError;
        error.isAxiosError = true;
        error.name = "AxiosError";
        error.message = "Client error";
        error.response = {
          status,
          statusText: "Client Error",
          data: {},
          headers: {},
          config: {} as any,
        };

        expect(isClientError(error)).toBe(true);
      });
    });

    it("should reject non-client errors", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";
      error.response = {
        status: 500,
        statusText: "Server Error",
        data: {},
        headers: {},
        config: {} as any,
      };

      expect(isClientError(error)).toBe(false);
    });

    it("should reject errors without response", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";

      expect(isClientError(error)).toBe(false);
    });
  });

  describe("isServerError", () => {
    it("should identify server errors (5xx)", () => {
      const serverStatuses = [500, 502, 503, 504, 599];

      serverStatuses.forEach((status) => {
        const error = new Error("Server error") as AxiosError;
        error.isAxiosError = true;
        error.name = "AxiosError";
        error.message = "Server error";
        error.response = {
          status,
          statusText: "Server Error",
          data: {},
          headers: {},
          config: {} as any,
        };

        expect(isServerError(error)).toBe(true);
      });
    });

    it("should reject non-server errors", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";
      error.response = {
        status: 400,
        statusText: "Client Error",
        data: {},
        headers: {},
        config: {} as any,
      };

      expect(isServerError(error)).toBe(false);
    });
  });

  describe("isAuthenticationError", () => {
    it("should identify 401 errors", () => {
      const error = new Error("Unauthorized") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Unauthorized";
      error.response = {
        status: 401,
        statusText: "Unauthorized",
        data: {},
        headers: {},
        config: {} as any,
      };

      expect(isAuthenticationError(error)).toBe(true);
    });

    it("should reject non-401 errors", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";
      error.response = {
        status: 403,
        statusText: "Forbidden",
        data: {},
        headers: {},
        config: {} as any,
      };

      expect(isAuthenticationError(error)).toBe(false);
    });
  });

  describe("isAuthorizationError", () => {
    it("should identify 403 errors", () => {
      const error = new Error("Forbidden") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Forbidden";
      error.response = {
        status: 403,
        statusText: "Forbidden",
        data: {},
        headers: {},
        config: {} as any,
      };

      expect(isAuthorizationError(error)).toBe(true);
    });

    it("should reject non-403 errors", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";
      error.response = {
        status: 401,
        statusText: "Unauthorized",
        data: {},
        headers: {},
        config: {} as any,
      };

      expect(isAuthorizationError(error)).toBe(false);
    });
  });

  describe("isNotFoundError", () => {
    it("should identify 404 errors", () => {
      const error = new Error("Not Found") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Not Found";
      error.response = {
        status: 404,
        statusText: "Not Found",
        data: {},
        headers: {},
        config: {} as any,
      };

      expect(isNotFoundError(error)).toBe(true);
    });

    it("should reject non-404 errors", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";
      error.response = {
        status: 400,
        statusText: "Bad Request",
        data: {},
        headers: {},
        config: {} as any,
      };

      expect(isNotFoundError(error)).toBe(false);
    });
  });

  describe("isValidationError", () => {
    it("should identify 422 errors", () => {
      const error = new Error("Unprocessable Entity") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Unprocessable Entity";
      error.response = {
        status: 422,
        statusText: "Unprocessable Entity",
        data: {},
        headers: {},
        config: {} as any,
      };

      expect(isValidationError(error)).toBe(true);
    });

    it("should reject non-422 errors", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";
      error.response = {
        status: 400,
        statusText: "Bad Request",
        data: {},
        headers: {},
        config: {} as any,
      };

      expect(isValidationError(error)).toBe(false);
    });
  });

  describe("isRateLimitError", () => {
    it("should identify 429 errors", () => {
      const error = new Error("Too Many Requests") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Too Many Requests";
      error.response = {
        status: 429,
        statusText: "Too Many Requests",
        data: {},
        headers: {},
        config: {} as any,
      };

      expect(isRateLimitError(error)).toBe(true);
    });

    it("should reject non-429 errors", () => {
      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";
      error.response = {
        status: 400,
        statusText: "Bad Request",
        data: {},
        headers: {},
        config: {} as any,
      };

      expect(isRateLimitError(error)).toBe(false);
    });
  });

  describe("isErrorWithStatus", () => {
    it("should create status-specific guards", () => {
      const is500Error = isErrorWithStatus(500);

      const error = new Error("Server Error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Server Error";
      error.response = {
        status: 500,
        statusText: "Internal Server Error",
        data: {},
        headers: {},
        config: {} as any,
      };

      expect(is500Error(error)).toBe(true);
    });

    it("should reject wrong status codes", () => {
      const is500Error = isErrorWithStatus(500);

      const error = new Error("Not Found") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Not Found";
      error.response = {
        status: 404,
        statusText: "Not Found",
        data: {},
        headers: {},
        config: {} as any,
      };

      expect(is500Error(error)).toBe(false);
    });
  });

  describe("isErrorWithCode", () => {
    it("should create code-specific guards", () => {
      const isNetworkCodeError = isErrorWithCode("ECONNABORTED");

      const error = new Error("Network Error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Network Error";
      error.code = "ECONNABORTED";

      expect(isNetworkCodeError(error)).toBe(true);
    });

    it("should reject wrong error codes", () => {
      const isNetworkCodeError = isErrorWithCode("ECONNABORTED");

      const error = new Error("Test error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Test error";
      error.code = "OTHER_CODE";

      expect(isNetworkCodeError(error)).toBe(false);
    });
  });

  describe("categorizeAxiosError", () => {
    it("should categorize network errors", () => {
      const error = new Error("Network Error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Network Error";
      error.code = "ENOTFOUND";

      const result = categorizeAxiosError(error);

      expect(result.isAxiosError).toBe(true);
      expect(result.category).toBe("network");
      expect(result.hasResponse).toBe(false);
    });

    it("should categorize timeout errors", () => {
      const error = new Error("Timeout") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Timeout";
      error.code = "ETIMEDOUT";

      const result = categorizeAxiosError(error);

      expect(result.isAxiosError).toBe(true);
      expect(result.category).toBe("timeout");
      expect(result.hasResponse).toBe(false);
    });

    it("should categorize cancel errors", () => {
      const error = new Error("Cancelled") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Cancelled";
      error.code = "ERR_CANCELED";

      const result = categorizeAxiosError(error);

      expect(result.isAxiosError).toBe(true);
      expect(result.category).toBe("cancel");
      expect(result.hasResponse).toBe(false);
    });

    it("should categorize client errors", () => {
      const error = new Error("Client Error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Client Error";
      error.response = {
        status: 400,
        statusText: "Bad Request",
        data: {},
        headers: {},
        config: {} as any,
      };

      const result = categorizeAxiosError(error);

      expect(result.isAxiosError).toBe(true);
      expect(result.category).toBe("client");
      expect(result.statusCode).toBe(400);
      expect(result.hasResponse).toBe(true);
    });

    it("should categorize server errors", () => {
      const error = new Error("Server Error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Server Error";
      error.response = {
        status: 500,
        statusText: "Internal Server Error",
        data: {},
        headers: {},
        config: {} as any,
      };

      const result = categorizeAxiosError(error);

      expect(result.isAxiosError).toBe(true);
      expect(result.category).toBe("server");
      expect(result.statusCode).toBe(500);
      expect(result.hasResponse).toBe(true);
    });

    it("should categorize unknown errors", () => {
      const error = new Error("Unknown Error") as AxiosError;
      error.isAxiosError = true;
      error.name = "AxiosError";
      error.message = "Unknown Error";

      const result = categorizeAxiosError(error);

      expect(result.isAxiosError).toBe(true);
      expect(result.category).toBe("unknown");
      expect(result.hasResponse).toBe(false);
    });

    it("should handle non-AxiosError", () => {
      const error = new Error("Regular Error");

      const result = categorizeAxiosError(error);

      expect(result.isAxiosError).toBe(false);
      expect(result.category).toBe("unknown");
      expect(result.hasResponse).toBe(false);
    });
  });
});
