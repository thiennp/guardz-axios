import axios, { AxiosResponse } from "axios";
import {
  safeGet,
  safePost,
  safeRequest,
  safe,
  createSafeApiContext,
} from "../utils";
import { isType, isString, isNumber, isBoolean } from "guardz";
import { Status } from "../types/status-types";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Test interfaces and type guards
interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

const isUser = isType<User>({
  id: isNumber,
  name: isString,
  email: isString,
  isActive: isBoolean,
});

// Mock response data
const validUserData: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  isActive: true,
};

const invalidUserData = {
  id: "1", // Should be number
  name: "John Doe",
  email: "john@example.com",
  isActive: true,
};

const mockAxiosResponse: AxiosResponse = {
  data: validUserData,
  status: 200,
  statusText: "OK",
  headers: {},
  config: {
    headers: {} as any,
  },
  request: {},
};

describe("Professional Safe Axios API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Pattern 1: Curried Functions", () => {
    it("should create and execute curried GET function", async () => {
      mockedAxios.request.mockResolvedValue(mockAxiosResponse);

      const onTypeMismatch = jest.fn();

      const getUserSafely = safeGet({
        guard: isUser,
        tolerance: false,
        onTypeMismatch,
      });

      const result = await getUserSafely("/users/1");

      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual(validUserData);
        expect(onTypeMismatch).not.toHaveBeenCalled();
      } else {
        throw new Error("Expected success but got error");
      }
    });

    it("should handle validation errors in tolerance mode", async () => {
      const invalidResponse = { ...mockAxiosResponse, data: invalidUserData };
      mockedAxios.request.mockResolvedValue(invalidResponse);

      const onTypeMismatch = jest.fn();

      const getUserSafely = safeGet({
        guard: isUser,
        tolerance: true,
        onTypeMismatch,
      });

      const result = await getUserSafely("/users/1");

      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual(invalidUserData);
        expect(onTypeMismatch).toHaveBeenCalled();
      } else {
        throw new Error("Expected success in tolerance mode but got error");
      }
    });

    it("should create and execute curried POST function", async () => {
      mockedAxios.request.mockResolvedValue(mockAxiosResponse);

      const createUserSafely = safePost({
        guard: isUser,
        tolerance: false,
      });

      const userData = {
        name: "New User",
        email: "new@example.com",
        isActive: true,
      };
      const result = await createUserSafely("/users", userData);

      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: "POST",
        url: "/users",
        data: userData,
      });

      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual(validUserData);
      } else {
        throw new Error("Expected success but got error");
      }
    });

    it("should handle retry logic", async () => {
      const networkError = new Error("Network Error");
      mockedAxios.request
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(mockAxiosResponse);

      const getUserWithRetry = safeGet({
        guard: isUser,
        retry: {
          attempts: 3,
          delay: 100,
          backoff: "linear",
        },
      });

      const result = await getUserWithRetry("/users/1");

      expect(mockedAxios.request).toHaveBeenCalledTimes(3);

      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual(validUserData);
      } else {
        throw new Error("Expected success after retries but got error");
      }
    });
  });

  describe("Pattern 2: Configuration-first", () => {
    it("should execute request with full configuration", async () => {
      mockedAxios.request.mockResolvedValue(mockAxiosResponse);

      const onTypeMismatch = jest.fn();

      const result = await safeRequest({
        url: "/users/1",
        method: "GET",
        guard: isUser,
        tolerance: true,
        timeout: 5000,
        onTypeMismatch,
        headers: {
          Accept: "application/json",
        },
      });

      expect(mockedAxios.request).toHaveBeenCalledWith({
        url: "/users/1",
        method: "GET",
        timeout: 5000,
        headers: {
          Accept: "application/json",
        },
      });

      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual(validUserData);
      } else {
        throw new Error("Expected success but got error");
      }
    });

    it("should handle custom retry logic", async () => {
      const timeoutError = new Error("timeout");
      const networkError = new Error("network");

      mockedAxios.request
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(mockAxiosResponse);

      const result = await safeRequest({
        url: "/users/1",
        method: "GET",
        guard: isUser,
        retry: {
          attempts: 3,
          delay: 50,
          retryOn: (error) => {
            return error instanceof Error && error.message.includes("timeout");
          },
        },
      });

      // Should only retry once (for timeout), then fail on network error
      expect(mockedAxios.request).toHaveBeenCalledTimes(2);

      if (result.status === Status.ERROR) {
        expect(result.message).toContain("network");
      } else {
        throw new Error("Expected error but got success");
      }
    });
  });

  describe("Pattern 3: Fluent API Builder", () => {
    it("should build and execute GET request", async () => {
      mockedAxios.request.mockResolvedValue(mockAxiosResponse);

      const onTypeMismatch = jest.fn();

      const result = await safe()
        .get("/users/1")
        .guard(isUser)
        .tolerance(true)
        .timeout(3000)
        .headers({ Authorization: "Bearer token" })
        .onTypeMismatch(onTypeMismatch)
        .execute();

      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: "GET",
        url: "/users/1",
        timeout: 3000,
        headers: { Authorization: "Bearer token" },
      });

      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual(validUserData);
      } else {
        throw new Error("Expected success but got error");
      }
    });

    it("should build and execute POST request", async () => {
      mockedAxios.request.mockResolvedValue(mockAxiosResponse);

      const postData = { name: "New User" };
      const result = await safe()
        .post("/users", postData)
        .guard(isUser)
        .tolerance(false)
        .identifier("create-user")
        .execute();

      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: "POST",
        url: "/users",
        data: postData,
      });

      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual(validUserData);
      } else {
        throw new Error("Expected success but got error");
      }
    });

    it("should throw error if guard is not provided", async () => {
      await expect(safe().get("/users/1").execute()).rejects.toThrow(
        "Type guard is required",
      );
    });

    it("should handle retry configuration in builder", async () => {
      const error = new Error("Server Error");
      mockedAxios.request
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockAxiosResponse);

      const result = await safe()
        .get("/users/1")
        .guard(isUser)
        .retry({
          attempts: 2,
          delay: 100,
          backoff: "exponential",
        })
        .execute();

      expect(mockedAxios.request).toHaveBeenCalledTimes(2);

      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual(validUserData);
      } else {
        throw new Error("Expected success after retries but got error");
      }
    });
  });

  describe("Pattern 4: Context/Provider", () => {
    beforeEach(() => {
      jest.spyOn(axios, "create").mockReturnValue(mockedAxios);
    });

    it("should create context with default configuration", async () => {
      mockedAxios.request.mockResolvedValue(mockAxiosResponse);

      const onTypeMismatch = jest.fn();

      const api = createSafeApiContext({
        baseURL: "https://api.example.com",
        timeout: 5000,
        defaultTolerance: true,
        onTypeMismatch,
      });

      const result = await api.get("/users/1", { guard: isUser });

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: "https://api.example.com",
        timeout: 5000,
        headers: undefined,
      });

      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual(validUserData);
      } else {
        throw new Error("Expected success but got error");
      }
    });

    it("should allow overriding context configuration per request", async () => {
      const invalidResponse = { ...mockAxiosResponse, data: invalidUserData };
      mockedAxios.request.mockResolvedValue(invalidResponse);

      const api = createSafeApiContext({
        defaultTolerance: true, // Context default
      });

      const result = await api.get("/users/1", {
        guard: isUser,
        tolerance: false, // Override context default
      });

      if (result.status === Status.ERROR) {
        expect(result.code).toBe(500);
        expect(result.message).toContain("validation");
      } else {
        throw new Error("Expected error but got success");
      }
    });

    it("should support fluent builder through context", async () => {
      mockedAxios.request.mockResolvedValue(mockAxiosResponse);

      const api = createSafeApiContext({
        baseURL: "https://api.example.com",
      });

      const result = await api
        .safe()
        .get("/users/1")
        .guard(isUser)
        .tolerance(true)
        .execute();

      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual(validUserData);
      } else {
        throw new Error("Expected success but got error");
      }
    });

    it("should handle POST requests with context", async () => {
      mockedAxios.request.mockResolvedValue(mockAxiosResponse);

      const api = createSafeApiContext({
        baseURL: "https://api.example.com",
      });

      const userData = {
        name: "New User",
        email: "new@example.com",
        isActive: true,
      };
      const result = await api.post("/users", userData, { guard: isUser });

      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: "POST",
        url: "/users",
        data: userData,
      });

      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual(validUserData);
      } else {
        throw new Error("Expected success but got error");
      }
    });
  });

  describe("Error Handling and Context", () => {
    it("should provide detailed error context", async () => {
      const networkError = new Error("Network Error");
      mockedAxios.request.mockRejectedValue(networkError);

      const onTypeMismatch = jest.fn();

      const result = await safeRequest({
        url: "/users/1",
        method: "GET",
        guard: isUser,
        onTypeMismatch,
      });

      if (result.status === Status.ERROR) {
        expect(result.message).toContain("Network Error");
        expect(result.code).toBe(500);
        expect(onTypeMismatch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            type: expect.any(String),
            url: "/users/1",
            method: "GET",
            originalError: networkError,
          }),
        );
      } else {
        throw new Error("Expected error but got success");
      }
    });

    it("should categorize different error types", async () => {
      const onTypeMismatch = jest.fn();

      // Test validation error
      const invalidResponse = { ...mockAxiosResponse, data: invalidUserData };
      mockedAxios.request.mockResolvedValue(invalidResponse);

      await safeRequest({
        url: "/users/1",
        method: "GET",
        guard: isUser,
        tolerance: false,
        onTypeMismatch,
      });

      expect(onTypeMismatch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: "validation",
        }),
      );
    });

    it("should track attempt numbers correctly", async () => {
      const error = new Error("Network Error");
      mockedAxios.request
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockAxiosResponse);

      const result = await safeRequest({
        url: "/users/1",
        method: "GET",
        guard: isUser,
        retry: {
          attempts: 3,
          delay: 10,
        },
      });

      if (result.status === Status.SUCCESS) {
        expect(result.data).toEqual(validUserData);
      } else {
        throw new Error("Expected success after retries but got error");
      }
    });
  });

  describe("Type Safety and Inference", () => {
    it("should maintain proper type inference for response data", async () => {
      mockedAxios.request.mockResolvedValue(mockAxiosResponse);

      const result = await safeGet({
        guard: isUser,
      })("/users/1");

      if (result.status === Status.SUCCESS) {
        // TypeScript should infer this as User
        expect(result.data.name).toBe("John Doe");
        expect(result.data.id).toBe(1);
        expect(result.data.email).toBe("john@example.com");
        expect(result.data.isActive).toBe(true);
      } else {
        throw new Error("Expected success but got error");
      }
    });

    it("should work with different type guards", async () => {
      interface Product {
        id: number;
        title: string;
        price: number;
      }

      const isProduct = isType<Product>({
        id: isNumber,
        title: isString,
        price: isNumber,
      });

      const productData: Product = {
        id: 1,
        title: "Test Product",
        price: 99.99,
      };
      const productResponse = { ...mockAxiosResponse, data: productData };
      mockedAxios.request.mockResolvedValue(productResponse);

      const result = await safeGet({
        guard: isProduct,
      })("/products/1");

      if (result.status === Status.SUCCESS) {
        expect(result.data.title).toBe("Test Product");
        expect(result.data.price).toBe(99.99);
      } else {
        throw new Error("Expected success but got error");
      }
    });
  });
});
