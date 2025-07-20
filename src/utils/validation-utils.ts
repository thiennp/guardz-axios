/**
 * Validation Utilities - Pure functions for data validation
 * Following Functional Programming (FP) principles
 */

import {
  ValidationGuard,
  ValidationConfig,
  ValidationContext,
  ErrorType,
} from "../domain/types";
import { guardWithTolerance } from "guardz";

/**
 * Validates data using a type guard
 * Pure function - no side effects, deterministic output
 */
export function validateData<T>(
  data: unknown,
  guard: ValidationGuard<T>,
  identifier?: string,
): { isValid: boolean; validatedData: T | null; errors: string[] } {
  const errors: string[] = [];

  const config = {
    identifier: identifier || "data",
    callbackOnError: (error: string) => errors.push(error),
  };

  const isValid = guard(data, config);

  return {
    isValid,
    validatedData: isValid ? (data as T) : null,
    errors,
  };
}

/**
 * Validates data with tolerance mode
 * Pure function - no side effects, deterministic output
 */
export function validateDataWithTolerance<T>(
  data: unknown,
  guard: ValidationGuard<T>,
  identifier?: string,
): { data: T; errors: string[] } {
  const errors: string[] = [];

  const config = {
    identifier: identifier || "data",
    callbackOnError: (error: string) => errors.push(error),
  };

  const validatedData = guardWithTolerance(data, guard, config);

  return {
    data: validatedData,
    errors,
  };
}

/**
 * Creates validation context
 * Pure function - no side effects, deterministic output
 */
export function createValidationContext(
  type: ErrorType,
  url: string,
  method: string,
  statusCode?: number,
  originalError?: unknown,
): ValidationContext {
  return {
    type,
    url,
    method: method as any,
    statusCode,
    originalError,
  };
}

/**
 * Merges validation configurations
 * Pure function - no side effects, deterministic output
 */
export function mergeValidationConfigs<T>(
  base: ValidationConfig<T>,
  override: Partial<ValidationConfig<T>>,
): ValidationConfig<T> {
  return {
    ...base,
    ...override,
  };
}

/**
 * Validates validation configuration
 * Pure function - no side effects, deterministic output
 */
export function validateValidationConfig<T>(
  config: ValidationConfig<T>,
): string | null {
  if (!config.guard) {
    return "Guard function is required";
  }

  if (typeof config.guard !== "function") {
    return "Guard must be a function";
  }

  if (config.tolerance && !config.onError) {
    return "Error callback is required when tolerance mode is enabled";
  }

  return null;
}

/**
 * Creates a validation error message
 * Pure function - no side effects, deterministic output
 */
export function createValidationErrorMessage(
  identifier: string,
  value: unknown,
  expectedType: string,
): string {
  return `Expected ${identifier} (${JSON.stringify(value)}) to be "${expectedType}"`;
}

/**
 * Formats validation errors for display
 * Pure function - no side effects, deterministic output
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) {
    return "No validation errors";
  }

  if (errors.length === 1) {
    return errors[0];
  }

  return `Multiple validation errors:\n${errors.map((error, index) => `${index + 1}. ${error}`).join("\n")}`;
}
