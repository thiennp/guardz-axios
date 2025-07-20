/**
 * Request Service Tests
 * Comprehensive tests for the RequestService with proper mocking
 */

import {
  RequestService,
  HttpClient,
  Logger,
} from "../../services/request-service";
import {
  CompleteRequestConfig,
  RequestStatus,
  HttpMethod,
} from "../../domain/types";
import { isString, isNumber, isType } from "guardz";
import { isSuccessResult, isErrorResult } from "../../utils/request-utils";

// Mock type guard
const isUser = isType({
  id: isNumber,
  name: isString,
});

// Mock HTTP client
const createMockHttpClient = (): HttpClient => ({
  request: jest.fn(),
});

// Mock logger
const createMockLogger = (): Logger => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
});

describe("RequestService", () => {
  let requestService: RequestService;
  let mockHttpClient: HttpClient;
  let mockLogger: Logger;

  beforeEach(() => {
    mockHttpClient = createMockHttpClient();
    mockLogger = createMockLogger();

    requestService = new RequestService({
      httpClient: mockHttpClient,
      logger: mockLogger,
      defaultTimeout: 5000,
      defaultRetryConfig: {
        attempts: 3,
        delay: 1000,
        backoff: "exponential",
      },
    });
  });

  describe("constructor", () => {
    it("should create service with default configuration", () => {
      const service = new RequestService({ httpClient: mockHttpClient });

      expect(service).toBeInstanceOf(RequestService);
    });

    it("should create service with custom configuration", () => {
      const service = new RequestService({
        httpClient: mockHttpClient,
        logger: mockLogger,
        defaultTimeout: 10000,
        defaultRetryConfig: {
          attempts: 5,
          delay: 2000,
          backoff: "linear",
        },
      });

      expect(service).toBeInstanceOf(RequestService);
    });
  });

  describe("executeRequest", () => {
    it("should execute successful request", async () => {
      const response = { data: { id: 1, name: "John" } };
      (mockHttpClient.request as jest.Mock).mockResolvedValue(response);

      const config: CompleteRequestConfig<{ id: number; name: string }> = {
        url: "https://api.example.com/users/1",
        method: "GET",
        guard: isUser,
      };

      const result = await requestService.executeRequest(config);

      expect(result.status).toBe(RequestStatus.SUCCESS);
      if (isSuccessResult(result)) {
        expect(result.data).toEqual({ id: 1, name: "John" });
      }
      expect(mockHttpClient.request).toHaveBeenCalledWith({
        url: "https://api.example.com/users/1",
        method: "GET",
        data: undefined,
        headers: undefined,
        timeout: 5000,
        baseURL: undefined,
      });
    });

    it("should handle validation errors", async () => {
      const response = { data: { id: "1", name: "John" } }; // id should be number
      (mockHttpClient.request as jest.Mock).mockResolvedValue(response);

      const config: CompleteRequestConfig<{ id: number; name: string }> = {
        url: "https://api.example.com/users/1",
        method: "GET",
        guard: isUser,
      };

      const result = await requestService.executeRequest(config);

      expect(result.status).toBe(RequestStatus.ERROR);
      if (result.status === RequestStatus.ERROR) {
        expect(result.code).toBe(500);
        expect(result.type).toBe("validation");
        expect(result.message).toContain("Expected data.id");
      }
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network Error");
      (networkError as any).code = "ECONNABORTED";
      (mockHttpClient.request as jest.Mock).mockRejectedValue(networkError);

      const config: CompleteRequestConfig<{ id: number; name: string }> = {
        url: "https://api.example.com/users/1",
        method: "GET",
        guard: isUser,
      };

      const result = await requestService.executeRequest(config);

      expect(result.status).toBe(RequestStatus.ERROR);
      if (isErrorResult(result)) {
        expect(result.code).toBe(500);
        expect(result.type).toBe("network");
      }
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should handle HTTP errors", async () => {
      const httpError = new Error("Not Found");
      (httpError as any).response = { status: 404 };
      (mockHttpClient.request as jest.Mock).mockRejectedValue(httpError);

      const config: CompleteRequestConfig<{ id: number; name: string }> = {
        url: "https://api.example.com/users/1",
        method: "GET",
        guard: isUser,
      };

      const result = await requestService.executeRequest(config);

      expect(result.status).toBe(RequestStatus.ERROR);
      if (result.status === RequestStatus.ERROR) {
        expect(result.code).toBe(404);
        expect(result.type).toBe("http");
      }
    });

    it("should handle tolerance mode", async () => {
      const response = { data: { id: "1", name: "John" } }; // id should be number
      (mockHttpClient.request as jest.Mock).mockResolvedValue(response);

      const onError = jest.fn();
      const config: CompleteRequestConfig<{ id: number; name: string }> = {
        url: "https://api.example.com/users/1",
        method: "GET",
        guard: isUser,
        tolerance: true,
        onError,
      };

      const result = await requestService.executeRequest(config);

      expect(result.status).toBe(RequestStatus.SUCCESS);
      if (result.status === RequestStatus.SUCCESS) {
        expect(result.data).toEqual({ id: "1", name: "John" });
      }
      expect(onError).toHaveBeenCalled();
    });

    it("should validate configuration", async () => {
      const config = {
        url: "", // Invalid: empty URL
        method: "GET" as HttpMethod,
        guard: isUser,
      } as CompleteRequestConfig<{ id: number; name: string }>;

      const result = await requestService.executeRequest(config);

      expect(result.status).toBe(RequestStatus.ERROR);
      if (result.status === RequestStatus.ERROR) {
        expect(result.code).toBe(500);
        expect(result.type).toBe("validation");
        expect(result.message).toContain("URL is required");
      }
    });
  });

  describe("retry logic", () => {
    it("should retry on network errors", async () => {
      const networkError = new Error("Network Error");
      (networkError as any).code = "ECONNABORTED";

      // Fail twice, succeed on third attempt
      (mockHttpClient.request as jest.Mock)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ data: { id: 1, name: "John" } });

      const config: CompleteRequestConfig<{ id: number; name: string }> = {
        url: "https://api.example.com/users/1",
        method: "GET",
        guard: isUser,
        retry: {
          attempts: 3,
          delay: 10, // Short delay for testing
          backoff: "exponential",
        },
      };

      const result = await requestService.executeRequest(config);

      expect(result.status).toBe(RequestStatus.SUCCESS);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(3);
    });

    it("should not retry on validation errors", async () => {
      const response = { data: { id: "1", name: "John" } }; // Invalid data
      (mockHttpClient.request as jest.Mock).mockResolvedValue(response);

      const config: CompleteRequestConfig<{ id: number; name: string }> = {
        url: "https://api.example.com/users/1",
        method: "GET",
        guard: isUser,
        retry: {
          attempts: 3,
          delay: 10,
          backoff: "exponential",
        },
      };

      const result = await requestService.executeRequest(config);

      expect(result.status).toBe(RequestStatus.ERROR);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1); // No retry
    });

    it("should use custom retry function", async () => {
      const error = new Error("Custom error");
      (mockHttpClient.request as jest.Mock).mockRejectedValue(error);

      const customRetryOn = jest.fn().mockReturnValue(false); // Don't retry
      const config: CompleteRequestConfig<{ id: number; name: string }> = {
        url: "https://api.example.com/users/1",
        method: "GET",
        guard: isUser,
        retry: {
          attempts: 3,
          delay: 10,
          backoff: "exponential",
          retryOn: customRetryOn,
        },
      };

      const result = await requestService.executeRequest(config);

      expect(result.status).toBe(RequestStatus.ERROR);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1); // No retry
      expect(customRetryOn).toHaveBeenCalledWith(error);
    });

    it("should exhaust retry attempts", async () => {
      const networkError = new Error("Network Error");
      (networkError as any).code = "ECONNABORTED";
      (mockHttpClient.request as jest.Mock).mockRejectedValue(networkError);

      const config: CompleteRequestConfig<{ id: number; name: string }> = {
        url: "https://api.example.com/users/1",
        method: "GET",
        guard: isUser,
        retry: {
          attempts: 2,
          delay: 10,
          backoff: "exponential",
        },
      };

      const result = await requestService.executeRequest(config);

      expect(result.status).toBe(RequestStatus.ERROR);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(2);
    });
  });

  describe("configuration handling", () => {
    it("should use custom timeout", async () => {
      const response = { data: { id: 1, name: "John" } };
      (mockHttpClient.request as jest.Mock).mockResolvedValue(response);

      const config: CompleteRequestConfig<{ id: number; name: string }> = {
        url: "https://api.example.com/users/1",
        method: "GET",
        guard: isUser,
        timeout: 10000,
      };

      await requestService.executeRequest(config);

      expect(mockHttpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 10000,
        }),
      );
    });

    it("should use custom headers", async () => {
      const response = { data: { id: 1, name: "John" } };
      (mockHttpClient.request as jest.Mock).mockResolvedValue(response);

      const config: CompleteRequestConfig<{ id: number; name: string }> = {
        url: "https://api.example.com/users/1",
        method: "GET",
        guard: isUser,
        headers: { Authorization: "Bearer token" },
      };

      await requestService.executeRequest(config);

      expect(mockHttpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: { Authorization: "Bearer token" },
        }),
      );
    });

    it("should handle POST requests with data", async () => {
      const response = { data: { id: 1, name: "John" } };
      (mockHttpClient.request as jest.Mock).mockResolvedValue(response);

      const config: CompleteRequestConfig<{ id: number; name: string }> = {
        url: "https://api.example.com/users",
        method: "POST",
        data: { name: "John" },
        guard: isUser,
      };

      await requestService.executeRequest(config);

      expect(mockHttpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          data: { name: "John" },
        }),
      );
    });
  });

  describe("error handling", () => {
    it("should handle unexpected errors", async () => {
      const unexpectedError = new Error("Unexpected error");
      (mockHttpClient.request as jest.Mock).mockRejectedValue(unexpectedError);

      const config: CompleteRequestConfig<{ id: number; name: string }> = {
        url: "https://api.example.com/users/1",
        method: "GET",
        guard: isUser,
      };

      const result = await requestService.executeRequest(config);

      expect(result.status).toBe(RequestStatus.ERROR);
      if (result.status === RequestStatus.ERROR) {
        expect(result.code).toBe(500);
        expect(result.type).toBe("unknown");
        expect(result.message).toBe("Unexpected error");
      }
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should validate retry configuration", async () => {
      const config: CompleteRequestConfig<{ id: number; name: string }> = {
        url: "https://api.example.com/users/1",
        method: "GET",
        guard: isUser,
        retry: {
          attempts: 0, // Invalid: less than 1
          delay: 1000,
          backoff: "exponential",
        },
      };

      const result = await requestService.executeRequest(config);

      expect(result.status).toBe(RequestStatus.ERROR);
      if (result.status === RequestStatus.ERROR) {
        expect(result.code).toBe(500);
        expect(result.type).toBe("validation");
        expect(result.message).toContain("Attempts must be at least 1");
      }
    });
  });
});
