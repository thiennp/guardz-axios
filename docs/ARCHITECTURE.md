# Guardz-Axios Architecture Documentation

## Overview

Guardz-Axios is a type-safe HTTP client built on Axios with runtime validation using the guardz library. The application follows Domain-Driven Design (DDD), Functional Programming (FP), and other software engineering best practices.

## Guardz Ecosystem Integration

Guardz-Axios is part of the comprehensive **Guardz ecosystem** - a TypeScript type guard solution designed to bring runtime type safety to your applications. The ecosystem consists of four core components that work seamlessly together:

### 🌟 **Ecosystem Components**

#### 1. **[guardz](https://www.npmjs.com/package/guardz)** - Core Type Guard Library

The foundation of the ecosystem, providing the type guard utilities used by all other components.

**Key Features:**

- 50+ built-in type guards for all JavaScript types
- Composite type guard creation with `isType()` and `isOneOf()`
- Array and object validation with `isArrayOf()` and `isRecord()`
- Optional and nullable types with `isOptional()` and `isNullable()`
- Union and intersection types with `isUnion()` and `isIntersection()`

**Integration with Guardz-Axios:**

```typescript
import { isType, isString, isNumber } from "guardz";
import { safeGet } from "guardz-axios";

// Create type guards for validation
const isUser = isType<User>({
  id: isNumber,
  name: isString,
  email: isString,
});

// Use in HTTP requests
const result = await safeGet({ guard: isUser })("/users/1");
```

#### 2. **[guardz-generator](https://www.npmjs.com/package/guardz-generator)** - Automatic Type Guard Generation

Automatically generates type guards from TypeScript interfaces, eliminating manual type guard creation.

**Key Features:**

- CLI tool for batch processing of TypeScript files
- Watch mode for development workflows
- Custom templates for specialized guards
- Integration with build tools and IDEs

**Integration with Guardz-Axios:**

```bash
# Generate guards from your TypeScript interfaces
npx guardz-generator generate "src/**/*.ts"

# This creates guards like:
# src/guards/user.guards.ts
# src/guards/post.guards.ts
```

```typescript
// Auto-generated guards
import { isUser, isPost } from "./guards";

// Use in HTTP requests
const userResult = await safeGet({ guard: isUser })("/users/1");
const postResult = await safeGet({ guard: isPost })("/posts/1");
```

#### 3. **[guardz-axios](https://www.npmjs.com/package/guardz-axios)** - Type-Safe HTTP Client

This package - provides type-safe HTTP requests with runtime validation.

**Key Features:**

- Runtime validation of all HTTP responses
- Type-safe results with discriminated unions
- Multiple API patterns (curried, fluent, configuration-first)
- Retry logic with exponential backoff
- Tolerance mode for graceful degradation
- Comprehensive error handling

#### 4. **[guardz-event](https://www.npmjs.com/package/guardz-event)** - Type-Safe Event Handling

Type-safe event handling with runtime validation, perfect for event-driven architectures.

**Key Features:**

- Type-safe event emitters with runtime validation
- Event type guards for payload validation
- Event listeners with automatic type inference
- Event middleware for transformation and filtering
- Event history and replay capabilities

**Integration with Guardz-Axios:**

```typescript
import { createTypedEventEmitter } from "guardz-event";
import { safeGet } from "guardz-axios";
import { isUser } from "./guards";

// Type-safe event handling
const emitter = createTypedEventEmitter({
  "user:fetched": isUser,
  "user:created": isUser,
});

// Type-safe HTTP requests
const result = await safeGet({ guard: isUser })("/users/1");

if (result.status === Status.SUCCESS) {
  // Emit type-safe event
  emitter.emit("user:fetched", result.data);
}
```

### 🔄 **Ecosystem Workflow**

The typical development workflow with the guardz ecosystem:

1. **Define Types** - Create TypeScript interfaces for your data models
2. **Generate Guards** - Use guardz-generator to automatically create type guards
3. **HTTP Requests** - Use guardz-axios for type-safe API calls
4. **Event Handling** - Use guardz-event for type-safe event communication
5. **Runtime Safety** - Enjoy full type safety across your entire application

### 🏗️ **Architecture Integration**

The guardz ecosystem components integrate at different architectural layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  guardz-axios  │  guardz-event  │  Custom Business Logic   │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│  guardz-generator  │  Auto-generated Type Guards           │
├─────────────────────────────────────────────────────────────┤
│                    Domain Layer                             │
├─────────────────────────────────────────────────────────────┤
│                    guardz (Core)                            │
└─────────────────────────────────────────────────────────────┘
```

## Architecture Principles

### 🏗️ **Domain-Driven Design (DDD)**

- **Domain Layer**: Core business concepts and types
- **Service Layer**: Business logic and orchestration
- **Infrastructure Layer**: External dependencies and adapters

### 🔄 **Functional Programming (FP)**

- Pure functions with no side effects
- Immutable data structures
- Composition over inheritance
- Higher-order functions

### 🎯 **SOLID Principles**

- **Single Responsibility**: Each class/function has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes are substitutable
- **Interface Segregation**: Small, focused interfaces
- **Dependency Inversion**: Depend on abstractions, not concretions

### 🚀 **Other Principles**

- **DRY**: Don't Repeat Yourself
- **YAGNI**: You Aren't Gonna Need It
- **KISS**: Keep It Simple, Stupid
- **CoI**: Composition over Inheritance

## Architecture Layers

### 1. Domain Layer (`src/domain/`)

**Purpose**: Core business concepts and types

```typescript
// Domain Types
export type RequestResult<T> =
  | { status: RequestStatus.SUCCESS; data: T }
  | { status: RequestStatus.ERROR; code: number; message: string; type: ErrorType };

export interface ValidationGuard<T> = TypeGuardFn<T>;
export interface RetryConfig { /* ... */ }
```

**Key Components**:

- `types.ts`: Core domain types and interfaces
- Business concepts: RequestStatus, ErrorType, ValidationGuard, etc.

**Integration with Guardz Ecosystem**:

```typescript
// Domain types can be used with guardz-generator
interface User {
  id: number;
  name: string;
  email: string;
}

// Auto-generated by guardz-generator
export const isUser = isType<User>({
  id: isNumber,
  name: isString,
  email: isString,
});
```

### 2. Service Layer (`src/services/`)

**Purpose**: Business logic and orchestration

```typescript
export class RequestService {
  async executeRequest<T>(
    config: CompleteRequestConfig<T>,
  ): Promise<RequestResult<T>> {
    // Business logic for request execution
  }
}
```

**Key Components**:

- `request-service.ts`: Core request execution logic
- Dependency injection for testability
- Error handling and retry logic

**Integration with Guardz Ecosystem**:

```typescript
// Service layer uses guardz for validation
import { TypeGuardFn } from "guardz";

export class RequestService {
  async executeRequest<T>(
    config: RequestConfig<T>,
    guard: TypeGuardFn<T>, // From guardz
  ): Promise<RequestResult<T>> {
    // Validation using guardz
    if (!guard(response.data)) {
      return { status: "ERROR", code: 500, message: "Validation failed" };
    }
  }
}
```

### 3. Utility Layer (`src/utils/`)

**Purpose**: Pure utility functions

```typescript
// Request utilities
export function createRequestConfig(
  url: string,
  method: HttpMethod,
): RequestConfig;
export function validateRequestConfig(config: RequestConfig): string | null;

// Validation utilities
export function validateData<T>(
  data: unknown,
  guard: ValidationGuard<T>,
): ValidationResult;

// Retry utilities
export function calculateRetryDelay(attempt: number, baseDelay: number): number;

// Error utilities
export function categorizeError(error: unknown): ErrorType;
```

**Key Components**:

- `request-utils.ts`: Request configuration and result handling
- `validation-utils.ts`: Data validation utilities
- `retry-utils.ts`: Retry logic utilities
- `error-utils.ts`: Error categorization and formatting

**Integration with Guardz Ecosystem**:

```typescript
// Validation utilities use guardz
import { TypeGuardFn } from "guardz";

export function validateData<T>(
  data: unknown,
  guard: TypeGuardFn<T>, // From guardz
): ValidationResult {
  return guard(data)
    ? { valid: true, data: data as T }
    : { valid: false, errors: ["Validation failed"] };
}
```

### 4. API Layer (`src/api/`)

**Purpose**: Unified interface combining all patterns

```typescript
export class UnifiedApi {
  // Pattern 1: Curried Functions
  createSafeGet<T>(
    guard: ValidationGuard<T>,
  ): (url: string) => Promise<RequestResult<T>>;

  // Pattern 2: Configuration-first
  safeRequest<T>(config: CompleteRequestConfig<T>): Promise<RequestResult<T>>;

  // Pattern 3: Fluent API Builder
  safe(): SafeRequestBuilder;

  // Pattern 4: Context API
  createContext(): SafeApiContext;
}
```

**Key Components**:

- `unified-api.ts`: Main API class with all patterns
- Multiple usage patterns for different preferences
- Factory functions for easy instantiation

**Integration with Guardz Ecosystem**:

```typescript
// API layer integrates with all ecosystem components
import { TypeGuardFn } from "guardz";
import { createTypedEventEmitter } from "guardz-event";

export class UnifiedApi {
  private eventEmitter = createTypedEventEmitter({
    "request:success": isRequestSuccessEvent,
    "request:error": isRequestErrorEvent,
  });

  async safeRequest<T>(
    config: RequestConfig<T>,
    guard: TypeGuardFn<T>, // From guardz
  ): Promise<RequestResult<T>> {
    // Implementation using guardz for validation
  }
}
```

## Usage Patterns

### Pattern 1: Curried Functions (Functional Style)

```typescript
import { createSafeGet } from "guardz-axios";
import { isUser } from "./guards"; // Generated by guardz-generator

const getUser = createSafeGet(isUser);
const result = await getUser("/users/1");

if (result.status === "SUCCESS") {
  console.log(result.data); // Type-safe user data
}
```

### Pattern 2: Configuration-first (Apollo/React Query style)

```typescript
import { UnifiedApi } from "guardz-axios";

const api = new UnifiedApi();
const result = await api.safeRequest({
  url: "/users/1",
  method: "GET",
  guard: isUser, // From guardz-generator
  timeout: 5000,
});
```

### Pattern 3: Fluent API Builder

```typescript
import { UnifiedApi } from "guardz-axios";

const api = new UnifiedApi();
const result = await api
  .safe()
  .get("/users/1")
  .guard(isUser) // From guardz-generator
  .timeout(5000)
  .retry({ attempts: 3, delay: 1000 })
  .execute();
```

### Pattern 4: Context API (React Context style)

```typescript
import { UnifiedApi } from "guardz-axios";

const api = new UnifiedApi();
const context = api.createContext();
const result = await context.get("/users/1", { guard: isUser }); // From guardz-generator
```

## Error Handling

### Error Types

```typescript
export type ErrorType =
  | "validation"
  | "network"
  | "timeout"
  | "http"
  | "unknown";
```

### Error Handling Patterns

```typescript
// Type-safe error handling
const result = await api.safeRequest(config);

if (api.isSuccess(result)) {
  // Handle success
  console.log(result.data);
} else {
  // Handle error
  console.error(`Error ${result.code}: ${result.message}`);

  switch (result.type) {
    case "validation":
      // Handle validation errors
      break;
    case "network":
      // Handle network errors
      break;
    case "timeout":
      // Handle timeout errors
      break;
    case "http":
      // Handle HTTP errors
      break;
  }
}
```

## Retry Logic

### Retry Configuration

```typescript
const retryConfig = {
  attempts: 3,
  delay: 1000,
  backoff: "exponential", // or 'linear'
  retryOn: (error: unknown) => boolean, // Custom retry condition
};
```

### Automatic Retry

```typescript
const result = await api.safeRequest({
  url: "/users/1",
  method: "GET",
  guard: isUser,
  retry: retryConfig,
});
```

## Validation

### Type Guards

```typescript
import { isString, isNumber, isType } from "guardz";

const isUser = isType({
  id: isNumber,
  name: isString,
  email: isString,
});
```

### Validation Modes

#### Strict Mode (Default)

```typescript
const result = await api.safeRequest({
  url: "/users/1",
  method: "GET",
  guard: isUser,
});

// Returns error if validation fails
```

#### Tolerance Mode

```typescript
const result = await api.safeRequest({
  url: "/users/1",
  method: "GET",
  guard: isUser,
  tolerance: true,
  onError: (error, context) => {
    console.warn("Validation warning:", error);
  },
});

// Returns data even if validation fails, logs warnings
```

## Testing

### Test Structure

```
src/__tests__/
├── api/
│   └── unified-api.test.ts      # API layer tests
├── services/
│   └── request-service.test.ts  # Service layer tests
└── utils/
    ├── request-utils.test.ts    # Request utility tests
    ├── validation-utils.test.ts # Validation utility tests
    ├── retry-utils.test.ts      # Retry utility tests
    └── error-utils.test.ts      # Error utility tests
```

### Testing Patterns

```typescript
// Mock HTTP client
const mockHttpClient = {
  request: jest.fn(),
};

// Mock logger
const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Test service with mocks
const service = new RequestService({
  httpClient: mockHttpClient,
  logger: mockLogger,
});
```

### Testing with Guardz Ecosystem

```typescript
// Test with auto-generated guards
import { isUser } from "../guards/user.guards"; // Generated by guardz-generator

describe("User API", () => {
  it("should validate user data", () => {
    const validUser = { id: 1, name: "John", email: "john@example.com" };
    const invalidUser = { id: "1", name: "John" }; // Missing email

    expect(isUser(validUser)).toBe(true);
    expect(isUser(invalidUser)).toBe(false);
  });
});
```

## Performance Considerations

### 1. **Lazy Loading**

- Type guards are only executed when needed
- Validation is skipped in tolerance mode if no callback provided

### 2. **Memory Efficiency**

- Pure functions with no side effects
- Immutable data structures
- Minimal object creation

### 3. **Network Optimization**

- Configurable timeouts
- Retry logic with exponential backoff
- Request deduplication (if implemented)

### 4. **Guardz Ecosystem Optimization**

- Auto-generated guards are optimized for performance
- Type guard caching for frequently used guards
- Minimal runtime overhead for validation

## Security Considerations

### 1. **Input Validation**

- All external data is validated using type guards
- No trust in external APIs

### 2. **Error Information**

- Sensitive information is not exposed in error messages
- Error logging is configurable

### 3. **Request Security**

- Headers can be configured for authentication
- HTTPS enforcement through configuration

### 4. **Guardz Ecosystem Security**

- Type guards provide runtime validation security
- Auto-generated guards ensure consistent validation
- Event validation prevents malicious payloads

## Migration Guide

### From Legacy API

```typescript
// Old way
import { safeGet } from "guardz-axios";

// New way
import { createSafeGet } from "guardz-axios";
const getUser = createSafeGet(isUser);
```

### Backward Compatibility

Legacy exports are still available but deprecated:

```typescript
// Legacy imports (deprecated)
import { safeExtractData } from "guardz-axios";

// New imports (recommended)
import { UnifiedApi } from "guardz-axios";
const api = new UnifiedApi();
```

### Migrating to Guardz Ecosystem

1. **Install ecosystem packages:**

   ```bash
   npm install guardz guardz-generator guardz-axios guardz-event
   ```

2. **Set up guardz-generator:**

   ```bash
   npx guardz-generator generate "src/**/*.ts"
   ```

3. **Update imports:**

   ```typescript
   // Old: Manual type guards
   const isUser = (data: unknown): data is User => {
     return typeof data === "object" && data !== null && "id" in data;
   };

   // New: Auto-generated guards
   import { isUser } from "./guards/user.guards";
   ```

4. **Add event handling:**

   ```typescript
   import { createTypedEventEmitter } from "guardz-event";

   const emitter = createTypedEventEmitter({
     "user:updated": isUser,
   });
   ```

## Best Practices

### 1. **Type Safety**

- Always use type guards for validation
- Leverage TypeScript's type system
- Use discriminated unions for results
- Generate guards automatically with guardz-generator

### 2. **Error Handling**

- Always check result status before accessing data
- Use type guards for error handling
- Log errors appropriately

### 3. **Configuration**

- Use environment variables for configuration
- Validate configuration at startup
- Use sensible defaults

### 4. **Testing**

- Test all error scenarios
- Mock external dependencies
- Use type-safe mocks
- Test with auto-generated guards

### 5. **Performance**

- Configure appropriate timeouts
- Use retry logic for transient failures
- Monitor and log performance metrics
- Cache frequently used type guards

### 6. **Guardz Ecosystem**

- Use guardz-generator for automatic guard generation
- Integrate guardz-event for type-safe event handling
- Leverage the full ecosystem for comprehensive type safety

## Future Enhancements

### 1. **Request Deduplication**

- Cache identical requests
- Share responses between concurrent requests

### 2. **Request Interceptors**

- Global request/response transformation
- Authentication token management

### 3. **Metrics and Monitoring**

- Request timing metrics
- Error rate monitoring
- Performance analytics

### 4. **Advanced Caching**

- Response caching with TTL
- Cache invalidation strategies
- Offline support

### 5. **Guardz Ecosystem Integration**

- Enhanced integration with guardz-generator
- Advanced event handling with guardz-event
- Ecosystem-wide type safety improvements

## Conclusion

The Guardz-Axios architecture provides a robust, type-safe, and flexible HTTP client that follows modern software engineering principles. The layered architecture ensures separation of concerns, while the multiple usage patterns accommodate different developer preferences and use cases.

The integration with the guardz ecosystem provides:

- **Comprehensive type safety** across the entire application
- **Automatic type guard generation** reducing development time
- **Type-safe event handling** for event-driven architectures
- **Runtime validation** ensuring data integrity

The application is designed to be:

- **Type-safe**: Full TypeScript support with runtime validation
- **Testable**: Dependency injection and pure functions
- **Maintainable**: Clear separation of concerns and SOLID principles
- **Extensible**: Plugin-friendly architecture
- **Performant**: Optimized for common use cases
- **Secure**: Input validation and error handling
- **Ecosystem-integrated**: Seamless integration with the guardz ecosystem
