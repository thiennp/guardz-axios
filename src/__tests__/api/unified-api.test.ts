/**
 * Unified API Tests
 * Comprehensive tests for the unified API layer
 */

import {
  UnifiedApi,
  createUnifiedApi,
  createSafeGet,
  createSafePost,
} from "../../api/unified-api";
import { RequestStatus, ErrorType } from "../../domain/types";
import { isString, isNumber, isType } from "guardz";
import axios from "axios";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock type guard
const isUser = isType({
  id: isNumber,
  name: isString,
});

describe("UnifiedApi", () => {
  let api: UnifiedApi;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      request: jest.fn(),
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    api = new UnifiedApi({
      baseURL: "https://api.example.com",
      timeout: 5000,
      headers: { "Content-Type": "application/json" },
      axiosInstance: mockAxiosInstance,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create API with default configuration", () => {
      const defaultApi = new UnifiedApi();
      expect(defaultApi).toBeInstanceOf(UnifiedApi);
    });

    it("should create API with custom configuration", () => {
      const customApi = new UnifiedApi({
        baseURL: "https://custom-api.com",
        timeout: 10000,
        headers: { Authorization: "Bearer token" },
      });
      expect(customApi).toBeInstanceOf(UnifiedApi);
    });
  });

  describe("Pattern 1: Curried Functions", () => {
    it("should create safe GET function", async () => {
      const response = {
        data: { id: 1, name: "John" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };
      mockAxiosInstance.request.mockResolvedValue(response);

      const safeGet = api.createSafeGet(isUser);
      const result = await safeGet("/users/1");

      expect(result.status).toBe(RequestStatus.SUCCESS);
      if (api.isSuccess(result)) {
        expect(result.data).toEqual({ id: 1, name: "John" });
      }
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/users/1",
          method: "GET",
          baseURL: "https://api.example.com",
          timeout: 5000,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    it("should create safe POST function", async () => {
      const response = {
        data: { id: 1, name: "John" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };
      mockAxiosInstance.request.mockResolvedValue(response);

      const safePost = api.createSafePost(isUser);
      const userData = { name: "John" };
      const result = await safePost("/users", userData);

      expect(result.status).toBe(RequestStatus.SUCCESS);
      if (api.isSuccess(result)) {
        expect(result.data).toEqual({ id: 1, name: "John" });
      }
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/users",
          method: "POST",
          data: userData,
        }),
      );
    });

    it("should handle validation errors", async () => {
      const response = {
        data: { id: "1", name: "John" }, // id should be number
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };
      mockAxiosInstance.request.mockResolvedValue(response);

      const safeGet = api.createSafeGet(isUser);
      const result = await safeGet("/users/1");

      expect(result.status).toBe(RequestStatus.ERROR);
      if (api.isError(result)) {
        expect(result.code).toBe(500);
        expect(result.type).toBe("validation");
      }
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network Error");
      (networkError as any).code = "ECONNABORTED";
      mockAxiosInstance.request.mockRejectedValue(networkError);

      const safeGet = api.createSafeGet(isUser);
      const result = await safeGet("/users/1");

      expect(result.status).toBe(RequestStatus.ERROR);
      if (api.isError(result)) {
        expect(result.code).toBe(500);
        expect(result.type).toBe("network");
      }
    });
  });

  describe("Pattern 2: Configuration-first", () => {
    it("should execute safe request with full configuration", async () => {
      const response = {
        data: { id: 1, name: "John" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };
      mockAxiosInstance.request.mockResolvedValue(response);

      const result = await api.safeRequest({
        url: "/users/1",
        method: "GET",
        guard: isUser,
        timeout: 10000,
        headers: { Authorization: "Bearer token" },
      });

      expect(result.status).toBe(RequestStatus.SUCCESS);
      if (api.isSuccess(result)) {
        expect(result.data).toEqual({ id: 1, name: "John" });
      }
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/users/1",
          method: "GET",
          timeout: 10000,
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer token",
          }),
        }),
      );
    });
  });

  describe("Pattern 3: Fluent API Builder", () => {
    it("should build and execute request fluently", async () => {
      const response = {
        data: { id: 1, name: "John" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };
      mockAxiosInstance.request.mockResolvedValue(response);

      const result = await api
        .safe()
        .get("/users/1")
        .guard(isUser)
        .timeout(10000)
        .headers({ Authorization: "Bearer token" })
        .execute();

      expect(result.status).toBe(RequestStatus.SUCCESS);
      if (api.isSuccess(result)) {
        expect(result.data).toEqual({ id: 1, name: "John" });
      }
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/users/1",
          method: "GET",
          timeout: 10000,
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer token",
          }),
        }),
      );
    });

    it("should handle POST with data", async () => {
      const response = {
        data: { id: 1, name: "John" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };
      mockAxiosInstance.request.mockResolvedValue(response);

      const userData = { name: "John" };
      const result = await api
        .safe()
        .post("/users", userData)
        .guard(isUser)
        .execute();

      expect(result.status).toBe(RequestStatus.SUCCESS);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/users",
          method: "POST",
          data: userData,
        }),
      );
    });

    it("should throw error when guard is missing", async () => {
      await expect(api.safe().get("/users/1").execute()).rejects.toThrow(
        "Guard function is required",
      );
    });
  });

  describe("Pattern 4: Context API", () => {
    it("should create and use context", async () => {
      const response = {
        data: { id: 1, name: "John" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };
      mockAxiosInstance.request.mockResolvedValue(response);

      const context = api.createContext();
      const result = await context.get("/users/1", { guard: isUser });

      expect(result.status).toBe(RequestStatus.SUCCESS);
      if (api.isSuccess(result)) {
        expect(result.data).toEqual({ id: 1, name: "John" });
      }
    });

    it("should handle POST with context", async () => {
      const response = {
        data: { id: 1, name: "John" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };
      mockAxiosInstance.request.mockResolvedValue(response);

      const context = api.createContext();
      const userData = { name: "John" };
      const result = await context.post("/users", userData, { guard: isUser });

      expect(result.status).toBe(RequestStatus.SUCCESS);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/users",
          method: "POST",
          data: userData,
        }),
      );
    });
  });

  describe("Utility Methods", () => {
    it("should check success status correctly", () => {
      const successResult = {
        status: RequestStatus.SUCCESS,
        data: { id: 1 },
      } as any;
      const errorResult = {
        status: RequestStatus.ERROR,
        code: 404,
        message: "Not Found",
        type: "http" as ErrorType,
      } as any;

      expect(api.isSuccess(successResult)).toBe(true);
      expect(api.isSuccess(errorResult)).toBe(false);
      expect(api.isError(errorResult)).toBe(true);
      expect(api.isError(successResult)).toBe(false);
    });

    it("should extract data correctly", () => {
      const successResult = {
        status: RequestStatus.SUCCESS,
        data: { id: 1 },
      } as any;
      const errorResult = {
        status: RequestStatus.ERROR,
        code: 404,
        message: "Not Found",
        type: "http" as ErrorType,
      } as any;

      expect(api.extractData(successResult)).toEqual({ id: 1 });
      expect(api.extractData(errorResult)).toBeNull();
    });

    it("should extract error correctly", () => {
      const successResult = {
        status: RequestStatus.SUCCESS,
        data: { id: 1 },
      } as any;
      const errorResult = {
        status: RequestStatus.ERROR,
        code: 404,
        message: "Not Found",
        type: "http" as ErrorType,
      } as any;

      expect(api.extractError(successResult)).toBeNull();
      expect(api.extractError(errorResult)).toEqual({
        code: 404,
        message: "Not Found",
        type: "http",
      });
    });
  });

  describe("Retry Logic", () => {
    it("should retry on network errors", async () => {
      const networkError = new Error("Network Error");
      (networkError as any).code = "ECONNABORTED";

      // Fail twice, succeed on third attempt
      mockAxiosInstance.request
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({
          data: { id: 1, name: "John" },
          status: 200,
          statusText: "OK",
          headers: {},
          config: {},
        });

      const result = await api.safeRequest({
        url: "/users/1",
        method: "GET",
        guard: isUser,
        retry: {
          attempts: 3,
          delay: 10, // Short delay for testing
          backoff: "exponential",
        },
      });

      expect(result.status).toBe(RequestStatus.SUCCESS);
      expect(mockAxiosInstance.request).toHaveBeenCalledTimes(3);
    });
  });

  describe("Tolerance Mode", () => {
    it("should handle tolerance mode", async () => {
      const response = {
        data: { id: "1", name: "John" }, // id should be number
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };
      mockAxiosInstance.request.mockResolvedValue(response);

      const onError = jest.fn();
      const result = await api.safeRequest({
        url: "/users/1",
        method: "GET",
        guard: isUser,
        tolerance: true,
        onError,
      });

      expect(result.status).toBe(RequestStatus.SUCCESS);
      if (api.isSuccess(result)) {
        expect(result.data).toEqual({ id: "1", name: "John" });
      }
      expect(onError).toHaveBeenCalled();
    });
  });
});

describe("Factory Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create unified API with factory function", () => {
    const api = createUnifiedApi({
      baseURL: "https://api.example.com",
      timeout: 5000,
    });
    expect(api).toBeInstanceOf(UnifiedApi);
  });

  it("should create safe GET function with factory", async () => {
    const mockAxiosInstance = {
      request: jest.fn().mockResolvedValue({
        data: { id: 1, name: "John" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      }),
    } as any;
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    const safeGet = createSafeGet(isUser, {
      baseURL: "https://api.example.com",
      axiosInstance: mockAxiosInstance,
    });

    const result = await safeGet("/users/1");
    expect(result.status).toBe(RequestStatus.SUCCESS);
  });

  it("should create safe POST function with factory", async () => {
    const mockAxiosInstance = {
      request: jest.fn().mockResolvedValue({
        data: { id: 1, name: "John" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      }),
    } as any;
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    const safePost = createSafePost(isUser, {
      baseURL: "https://api.example.com",
      axiosInstance: mockAxiosInstance,
    });

    const result = await safePost("/users", { name: "John" });
    expect(result.status).toBe(RequestStatus.SUCCESS);
  });
});
