import { isString } from "guardz";
import {
  isAxiosResponse,
  isAxiosResponseWithData,
  isSuccessResponse,
  isSuccessResponseWithData,
  isClientErrorResponse,
  isServerErrorResponse,
  isJsonResponse,
  isCreatedResponse,
  isEmptyResponse,
} from "../guards/axios-response-guards";

// Mock Axios response structure for testing
const createMockResponse = (overrides: any = {}) => ({
  data: { message: "success" },
  status: 200,
  statusText: "OK",
  headers: { "content-type": "application/json" },
  config: { url: "https://api.example.com" },
  request: {},
  ...overrides,
});

describe("Axios Response Guards", () => {
  describe("isAxiosResponse", () => {
    it("should return true for valid Axios response", () => {
      const response = createMockResponse();
      expect(isAxiosResponse(response)).toBe(true);
    });

    it("should return false for invalid response structure", () => {
      expect(isAxiosResponse(null)).toBe(false);
      expect(isAxiosResponse({})).toBe(false);
      expect(isAxiosResponse({ data: "test" })).toBe(false);
    });

    it("should return false for missing required properties", () => {
      const response = createMockResponse();
      delete response.status;
      expect(isAxiosResponse(response)).toBe(false);
    });
  });

  describe("isAxiosResponseWithData", () => {
    it("should validate response with correct data type", () => {
      const response = createMockResponse({ data: "test string" });
      const guard = isAxiosResponseWithData(isString);
      expect(guard(response)).toBe(true);
    });

    it("should reject response with incorrect data type", () => {
      const response = createMockResponse({ data: 123 });
      const guard = isAxiosResponseWithData(isString);
      expect(guard(response)).toBe(false);
    });
  });

  describe("isSuccessResponse", () => {
    it("should return true for 2xx status codes", () => {
      expect(isSuccessResponse(createMockResponse({ status: 200 }))).toBe(true);
      expect(isSuccessResponse(createMockResponse({ status: 201 }))).toBe(true);
      expect(isSuccessResponse(createMockResponse({ status: 299 }))).toBe(true);
    });

    it("should return false for non-2xx status codes", () => {
      expect(isSuccessResponse(createMockResponse({ status: 300 }))).toBe(
        false,
      );
      expect(isSuccessResponse(createMockResponse({ status: 400 }))).toBe(
        false,
      );
      expect(isSuccessResponse(createMockResponse({ status: 500 }))).toBe(
        false,
      );
    });
  });

  describe("isSuccessResponseWithData", () => {
    it("should validate successful response with correct data type", () => {
      const response = createMockResponse({
        status: 200,
        data: { id: 1, name: "test" },
      });

      const userGuard = (
        value: unknown,
      ): value is { id: number; name: string } => {
        return (
          typeof value === "object" &&
          value !== null &&
          "id" in value &&
          "name" in value &&
          typeof (value as any).id === "number" &&
          typeof (value as any).name === "string"
        );
      };

      const guard = isSuccessResponseWithData(userGuard);
      expect(guard(response)).toBe(true);
    });
  });

  describe("isClientErrorResponse", () => {
    it("should return true for 4xx status codes", () => {
      expect(isClientErrorResponse(createMockResponse({ status: 400 }))).toBe(
        true,
      );
      expect(isClientErrorResponse(createMockResponse({ status: 404 }))).toBe(
        true,
      );
      expect(isClientErrorResponse(createMockResponse({ status: 499 }))).toBe(
        true,
      );
    });

    it("should return false for non-4xx status codes", () => {
      expect(isClientErrorResponse(createMockResponse({ status: 200 }))).toBe(
        false,
      );
      expect(isClientErrorResponse(createMockResponse({ status: 500 }))).toBe(
        false,
      );
    });
  });

  describe("isServerErrorResponse", () => {
    it("should return true for 5xx status codes", () => {
      expect(isServerErrorResponse(createMockResponse({ status: 500 }))).toBe(
        true,
      );
      expect(isServerErrorResponse(createMockResponse({ status: 503 }))).toBe(
        true,
      );
      expect(isServerErrorResponse(createMockResponse({ status: 599 }))).toBe(
        true,
      );
    });

    it("should return false for non-5xx status codes", () => {
      expect(isServerErrorResponse(createMockResponse({ status: 200 }))).toBe(
        false,
      );
      expect(isServerErrorResponse(createMockResponse({ status: 400 }))).toBe(
        false,
      );
    });
  });

  describe("isJsonResponse", () => {
    it("should return true for JSON content type", () => {
      const response = createMockResponse({
        headers: { "content-type": "application/json" },
      });
      expect(isJsonResponse(response)).toBe(true);
    });

    it("should return true for JSON content type with charset", () => {
      const response = createMockResponse({
        headers: { "content-type": "application/json; charset=utf-8" },
      });
      expect(isJsonResponse(response)).toBe(true);
    });

    it("should return false for non-JSON content type", () => {
      const response = createMockResponse({
        headers: { "content-type": "text/html" },
      });
      expect(isJsonResponse(response)).toBe(false);
    });
  });

  describe("isCreatedResponse", () => {
    it("should return true for 201 status code", () => {
      expect(isCreatedResponse(createMockResponse({ status: 201 }))).toBe(true);
    });

    it("should return false for non-201 status codes", () => {
      expect(isCreatedResponse(createMockResponse({ status: 200 }))).toBe(
        false,
      );
      expect(isCreatedResponse(createMockResponse({ status: 202 }))).toBe(
        false,
      );
    });
  });

  describe("isEmptyResponse", () => {
    it("should return true for 204 status code", () => {
      expect(isEmptyResponse(createMockResponse({ status: 204 }))).toBe(true);
    });

    it("should return false for non-204 status codes", () => {
      expect(isEmptyResponse(createMockResponse({ status: 200 }))).toBe(false);
      expect(isEmptyResponse(createMockResponse({ status: 404 }))).toBe(false);
    });
  });
});
