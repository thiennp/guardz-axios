/**
 * Request Utils Tests
 * Comprehensive tests for all request utility functions
 */

import {
  createRequestConfig,
  mergeRequestConfigs,
  validateRequestConfig,
  createSuccessResult,
  createErrorResult,
  isSuccessResult,
  isErrorResult,
  extractData,
  extractError,
} from "../../utils/request-utils";
import { RequestStatus, HttpMethod, ErrorType } from "../../domain/types";

describe("Request Utils", () => {
  describe("createRequestConfig", () => {
    it("should create a valid request configuration", () => {
      const config = createRequestConfig(
        "https://api.example.com/users",
        "GET",
        undefined,
        { "Content-Type": "application/json" },
        5000,
        "https://api.example.com",
      );

      expect(config).toEqual({
        url: "https://api.example.com/users",
        method: "GET",
        data: undefined,
        headers: { "Content-Type": "application/json" },
        timeout: 5000,
        baseURL: "https://api.example.com",
      });
    });

    it("should create minimal request configuration", () => {
      const config = createRequestConfig("https://api.example.com", "POST");

      expect(config).toEqual({
        url: "https://api.example.com",
        method: "POST",
        data: undefined,
        headers: undefined,
        timeout: undefined,
        baseURL: undefined,
      });
    });

    it("should handle all HTTP methods", () => {
      const methods: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

      methods.forEach((method) => {
        const config = createRequestConfig("https://api.example.com", method);
        expect(config.method).toBe(method);
      });
    });
  });

  describe("mergeRequestConfigs", () => {
    it("should merge configurations correctly", () => {
      const base = createRequestConfig("https://api.example.com", "GET");
      const override = {
        method: "POST" as HttpMethod,
        data: { name: "John" },
        headers: { Authorization: "Bearer token" },
      };

      const merged = mergeRequestConfigs(base, override);

      expect(merged).toEqual({
        url: "https://api.example.com",
        method: "POST",
        data: { name: "John" },
        headers: { Authorization: "Bearer token" },
        timeout: undefined,
        baseURL: undefined,
      });
    });

    it("should merge headers correctly", () => {
      const base = createRequestConfig(
        "https://api.example.com",
        "GET",
        undefined,
        { "Content-Type": "application/json" },
      );
      const override = { headers: { Authorization: "Bearer token" } };

      const merged = mergeRequestConfigs(base, override);

      expect(merged.headers).toEqual({
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      });
    });

    it("should override all properties", () => {
      const base = createRequestConfig(
        "https://api.example.com",
        "GET",
        { old: "data" },
        { "Old-Header": "value" },
        1000,
        "https://old.com",
      );
      const override = {
        url: "https://new-api.com",
        method: "POST" as HttpMethod,
        data: { new: "data" },
        headers: { "New-Header": "value" },
        timeout: 2000,
        baseURL: "https://new.com",
      };

      const merged = mergeRequestConfigs(base, override);

      expect(merged).toEqual({
        ...override,
        headers: {
          "Old-Header": "value",
          "New-Header": "value",
        },
      });
    });
  });

  describe("validateRequestConfig", () => {
    it("should return null for valid configuration", () => {
      const config = createRequestConfig("https://api.example.com", "GET");
      const result = validateRequestConfig(config);
      expect(result).toBeNull();
    });

    it("should throw error for missing URL", () => {
      expect(() => createRequestConfig("", "GET")).toThrow(
        "URL must be a non-empty string",
      );
    });

    it("should throw error for missing method", () => {
      expect(() =>
        createRequestConfig("https://api.example.com", "" as HttpMethod),
      ).toThrow("HTTP method must be a non-empty string");
    });

    it("should throw error for negative timeout", () => {
      expect(() =>
        createRequestConfig(
          "https://api.example.com",
          "GET",
          undefined,
          undefined,
          -1000,
        ),
      ).toThrow("Timeout must be a non-negative number");
    });

    it("should accept zero timeout", () => {
      const config = createRequestConfig(
        "https://api.example.com",
        "GET",
        undefined,
        undefined,
        0,
      );
      const result = validateRequestConfig(config);
      expect(result).toBeNull();
    });
  });

  describe("createSuccessResult", () => {
    it("should create success result with data", () => {
      const data = { id: 1, name: "John" };
      const result = createSuccessResult(data);

      expect(result).toEqual({
        status: RequestStatus.SUCCESS,
        data,
      });
    });

    it("should handle primitive data types", () => {
      expect(createSuccessResult("string")).toEqual({
        status: RequestStatus.SUCCESS,
        data: "string",
      });

      expect(createSuccessResult(123)).toEqual({
        status: RequestStatus.SUCCESS,
        data: 123,
      });

      expect(createSuccessResult(true)).toEqual({
        status: RequestStatus.SUCCESS,
        data: true,
      });
    });

    it("should handle null and undefined", () => {
      expect(createSuccessResult(null)).toEqual({
        status: RequestStatus.SUCCESS,
        data: null,
      });

      expect(createSuccessResult(undefined)).toEqual({
        status: RequestStatus.SUCCESS,
        data: undefined,
      });
    });
  });

  describe("createErrorResult", () => {
    it("should create error result with all properties", () => {
      const result = createErrorResult(404, "Not Found", "http");

      expect(result).toEqual({
        status: RequestStatus.ERROR,
        code: 404,
        message: "Not Found",
        type: "http",
      });
    });

    it("should use default error type when not provided", () => {
      const result = createErrorResult(500, "Internal Server Error");

      expect(result).toEqual({
        status: RequestStatus.ERROR,
        code: 500,
        message: "Internal Server Error",
        type: "unknown",
      });
    });

    it("should handle different error types", () => {
      const types = [
        "validation",
        "network",
        "timeout",
        "http",
        "unknown",
      ] as const;

      types.forEach((type) => {
        const result = createErrorResult(500, "Error", type);
        expect((result as any).type).toBe(type);
      });
    });
  });

  describe("isSuccessResult", () => {
    it("should return true for success result", () => {
      const result = createSuccessResult({ id: 1 });
      expect(isSuccessResult(result)).toBe(true);
    });

    it("should return false for error result", () => {
      const result = createErrorResult(404, "Not Found");
      expect(isSuccessResult(result)).toBe(false);
    });

    it("should provide proper type narrowing", () => {
      const result = createSuccessResult({ id: 1 });

      if (isSuccessResult(result)) {
        // TypeScript should know this is a success result
        expect(result.data.id).toBe(1);
      }
    });
  });

  describe("isErrorResult", () => {
    it("should return true for error result", () => {
      const result = createErrorResult(404, "Not Found");
      expect(isErrorResult(result)).toBe(true);
    });

    it("should return false for success result", () => {
      const result = createSuccessResult({ id: 1 });
      expect(isErrorResult(result)).toBe(false);
    });

    it("should identify error results correctly", () => {
      const result = createErrorResult(404, "Not Found", "http");
      expect(isErrorResult(result)).toBe(true);
    });
  });

  describe("extractData", () => {
    it("should extract data from success result", () => {
      const data = { id: 1, name: "John" };
      const result = createSuccessResult(data);
      const extracted = extractData(result);

      expect(extracted).toBe(data);
    });

    it("should return null for error result", () => {
      const result = createErrorResult(404, "Not Found");
      const extracted = extractData(result);

      expect(extracted).toBeNull();
    });
  });

  describe("extractError", () => {
    it("should extract error information from error result", () => {
      const result = createErrorResult(404, "Not Found", "http");
      const extracted = extractError(result);

      expect(extracted).toEqual({
        code: 404,
        message: "Not Found",
        type: "http",
      });
    });

    it("should return null for success result", () => {
      const result = createSuccessResult({ id: 1 });
      const extracted = extractError(result);

      expect(extracted).toBeNull();
    });
  });
});
