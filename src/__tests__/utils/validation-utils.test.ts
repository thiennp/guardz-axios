/**
 * Validation Utils Tests
 * Comprehensive tests for all validation utility functions
 */

import {
  validateData,
  validateDataWithTolerance,
  createValidationContext,
  mergeValidationConfigs,
  validateValidationConfig,
  createValidationErrorMessage,
  formatValidationErrors,
} from "../../utils/validation-utils";
import {
  ValidationGuard,
  ValidationConfig,
  ErrorType,
} from "../../domain/types";
import { isString, isNumber, isType } from "guardz";

// Mock type guards for testing
const isUser: ValidationGuard<{ id: number; name: string }> = isType({
  id: isNumber,
  name: isString,
});

const isSimpleString: ValidationGuard<string> = isString;

describe("Validation Utils", () => {
  describe("validateData", () => {
    it("should validate data successfully", () => {
      const data = { id: 1, name: "John" };
      const result = validateData(data, isUser, "user");

      expect(result.isValid).toBe(true);
      expect(result.validatedData).toEqual(data);
      expect(result.errors).toEqual([]);
    });

    it("should fail validation with detailed errors", () => {
      const data = { id: "1", name: "John" }; // id should be number
      const result = validateData(data, isUser, "user");

      expect(result.isValid).toBe(false);
      expect(result.validatedData).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("user.id");
    });

    it("should handle primitive types", () => {
      const result = validateData("test", isSimpleString, "name");
      expect(result.isValid).toBe(true);
      expect(result.validatedData).toBe("test");
    });

    it("should fail primitive type validation", () => {
      const result = validateData(123, isSimpleString, "name");
      expect(result.isValid).toBe(false);
      expect(result.validatedData).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should use default identifier when not provided", () => {
      const data = { id: "1", name: "John" };
      const result = validateData(data, isUser);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("data.id");
    });
  });

  describe("validateDataWithTolerance", () => {
    it("should return data even with validation errors", () => {
      const data = { id: "1", name: "John" }; // id should be number
      const result = validateDataWithTolerance(data, isUser, "user");

      expect(result.data).toEqual(data);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should return data without errors when validation passes", () => {
      const data = { id: 1, name: "John" };
      const result = validateDataWithTolerance(data, isUser, "user");

      expect(result.data).toEqual(data);
      expect(result.errors).toEqual([]);
    });

    it("should handle primitive types with tolerance", () => {
      const result = validateDataWithTolerance("test", isSimpleString, "name");
      expect(result.data).toBe("test");
      expect(result.errors).toEqual([]);
    });

    it("should handle primitive type failures with tolerance", () => {
      const result = validateDataWithTolerance(123, isSimpleString, "name");
      expect(result.data).toBe(123);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("createValidationContext", () => {
    it("should create validation context with all properties", () => {
      const error = new Error("Test error");
      const context = createValidationContext(
        "validation",
        "https://api.example.com/users",
        "GET",
        400,
        error,
      );

      expect(context).toEqual({
        type: "validation",
        url: "https://api.example.com/users",
        method: "GET",
        statusCode: 400,
        originalError: error,
      });
    });

    it("should create validation context without optional properties", () => {
      const context = createValidationContext(
        "network",
        "https://api.example.com/users",
        "POST",
      );

      expect(context).toEqual({
        type: "network",
        url: "https://api.example.com/users",
        method: "POST",
        statusCode: undefined,
        originalError: undefined,
      });
    });

    it("should handle all error types", () => {
      const errorTypes: ErrorType[] = [
        "validation",
        "network",
        "timeout",
        "http",
        "unknown",
      ];

      errorTypes.forEach((type) => {
        const context = createValidationContext(
          type,
          "https://api.example.com",
          "GET",
        );
        expect(context.type).toBe(type);
      });
    });
  });

  describe("mergeValidationConfigs", () => {
    it("should merge validation configurations", () => {
      const base: ValidationConfig<{ id: number }> = {
        guard: isType({ id: isNumber }),
        tolerance: false,
        identifier: "base",
      };

      const override: Partial<ValidationConfig<{ id: number }>> = {
        tolerance: true,
        identifier: "override",
      };

      const merged = mergeValidationConfigs(base, override);

      expect(merged).toEqual({
        guard: base.guard,
        tolerance: true,
        identifier: "override",
      });
    });

    it("should preserve base config when no override", () => {
      const base: ValidationConfig<{ id: number }> = {
        guard: isType({ id: isNumber }),
        tolerance: false,
        identifier: "base",
      };

      const merged = mergeValidationConfigs(base, {});

      expect(merged).toEqual(base);
    });

    it("should override all properties", () => {
      const base: ValidationConfig<{ id: number }> = {
        guard: isType({ id: isNumber }),
        tolerance: false,
        identifier: "base",
      };

      const override: Partial<ValidationConfig<{ id: number }>> = {
        guard: isType({ id: isNumber }),
        tolerance: true,
        identifier: "override",
        onError: jest.fn(),
      };

      const merged = mergeValidationConfigs(base, override);

      expect(merged.tolerance).toBe(true);
      expect(merged.identifier).toBe("override");
      expect(merged.onError).toBe(override.onError);
    });
  });

  describe("validateValidationConfig", () => {
    it("should return null for valid configuration", () => {
      const config: ValidationConfig<{ id: number }> = {
        guard: isType({ id: isNumber }),
      };

      const result = validateValidationConfig(config);
      expect(result).toBeNull();
    });

    it("should return error for missing guard", () => {
      const config = {} as ValidationConfig<{ id: number }>;
      const result = validateValidationConfig(config);
      expect(result).toBe("Guard function is required");
    });

    it("should return error for non-function guard", () => {
      const config = {
        guard: "not a function",
      } as any as ValidationConfig<{ id: number }>;

      const result = validateValidationConfig(config);
      expect(result).toBe("Guard must be a function");
    });

    it("should return error for tolerance without error callback", () => {
      const config: ValidationConfig<{ id: number }> = {
        guard: isType({ id: isNumber }),
        tolerance: true,
      };

      const result = validateValidationConfig(config);
      expect(result).toBe(
        "Error callback is required when tolerance mode is enabled",
      );
    });

    it("should accept tolerance with error callback", () => {
      const config: ValidationConfig<{ id: number }> = {
        guard: isType({ id: isNumber }),
        tolerance: true,
        onError: jest.fn(),
      };

      const result = validateValidationConfig(config);
      expect(result).toBeNull();
    });
  });

  describe("createValidationErrorMessage", () => {
    it("should create validation error message", () => {
      const message = createValidationErrorMessage("user.id", "1", "number");
      expect(message).toBe('Expected user.id ("1") to be "number"');
    });

    it("should handle complex values", () => {
      const message = createValidationErrorMessage("user", { id: "1" }, "User");
      expect(message).toBe('Expected user ({"id":"1"}) to be "User"');
    });

    it("should handle null and undefined", () => {
      expect(createValidationErrorMessage("user", null, "User")).toBe(
        'Expected user (null) to be "User"',
      );
      expect(createValidationErrorMessage("user", undefined, "User")).toBe(
        'Expected user (undefined) to be "User"',
      );
    });
  });

  describe("formatValidationErrors", () => {
    it("should format single error", () => {
      const errors = ["Expected user.id to be number"];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toBe("Expected user.id to be number");
    });

    it("should format multiple errors", () => {
      const errors = [
        "Expected user.id to be number",
        "Expected user.name to be string",
        "Expected user.email to be string",
      ];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toBe(
        "Multiple validation errors:\n1. Expected user.id to be number\n2. Expected user.name to be string\n3. Expected user.email to be string",
      );
    });

    it("should handle empty errors array", () => {
      const formatted = formatValidationErrors([]);
      expect(formatted).toBe("No validation errors");
    });

    it("should handle single error in array", () => {
      const errors = ["Single error"];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toBe("Single error");
    });
  });
});
