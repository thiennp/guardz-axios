# Guardz Axios

[![GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-Support%20this%20project-red?style=for-the-badge&logo=github)](https://github.com/sponsors/thiennp)

A type-safe HTTP client built on top of Axios with runtime validation using [guardz](https://github.com/thiennp/guardz) 1.7.0+.

## What This Library Does

Guardz Axios transforms your HTTP requests into type-safe operations that automatically validate response data at runtime. Instead of manually checking response types and handling errors, you get:

- **Automatic runtime validation** of all response data
- **Type-safe results** with discriminated unions
- **Comprehensive error handling** with detailed feedback
- **Multiple API patterns** for different use cases
- **Retry logic** with configurable backoff strategies
- **Tolerance mode** for graceful degradation

## Installation

```bash
npm install guardz-axios guardz axios
```

## Features

This library is built on top of [guardz 1.7.0+](https://github.com/thiennp/guardz) and provides:

## Quick Start

```typescript
import { safeGet } from 'guardz-axios';
import { isType, isString, isNumber } from 'guardz';
import { Status } from 'guardz-axios';

interface User {
  id: number;
  name: string;
  email: string;
}

const isUser = isType<User>({
  id: isNumber,
  name: isString,
  email: isString,
});

const result = await safeGet({ guard: isUser })('/users/1');

if (result.status === Status.SUCCESS) {
  console.log('User:', result.data); // Fully typed as User
} else {
  console.log('Error:', result.code, result.message);
}
```

## How It Works

### Result Type

The library uses a **discriminated union** for type-safe results:

```typescript
type SafeRequestResult<T> = 
  | { status: Status.SUCCESS; data: T }
  | { status: Status.ERROR; code: number; message: string };
```

### Success Response

When the request succeeds and validation passes:

```typescript
{
  status: Status.SUCCESS,
  data: T // Your validated data
}
```

### Error Response

When the request fails or validation fails:

```typescript
{
  status: Status.ERROR,
  code: number,    // HTTP status code or 500 for validation errors
  message: string  // Human-readable error message
}
```

## Error Types and Messages

### 1. Validation Errors (Code: 500)
When response data doesn't match the expected type:

```typescript
{
  status: Status.ERROR,
  code: 500,
  message: "Response data validation failed: Expected userData.id (\"1\") to be \"number\""
}
```

### 2. Network Errors (Code: 500)
When network requests fail:

```typescript
{
  status: Status.ERROR,
  code: 500,
  message: "Network Error"
}
```

### 3. Timeout Errors (Code: 500)
When requests timeout:

```typescript
{
  status: Status.ERROR,
  code: 500,
  message: "timeout of 5000ms exceeded"
}
```

### 4. HTTP Status Errors
When the server returns error status codes:

```typescript
{
  status: Status.ERROR,
  code: 404,
  message: "Not Found"
}
```

## Error Handling Examples

### Basic Error Handling
```typescript
const result = await safeGet({ guard: isUser })('/users/1');

if (result.status === Status.SUCCESS) {
  console.log('Success:', result.data);
} else {
  console.error(`Request failed: ${result.message}`);
  console.error(`Status: ${result.code}`);
}
```

### Tolerance Mode Error Handling
```typescript
const result = await safeGet({ 
  guard: isUser,
  tolerance: true,
  onError: (error, context) => {
    console.warn(`Validation warning: ${error}`);
    console.warn(`Context: ${context.url} (${context.method})`);
  }
})('/users/1');

if (result.status === Status.SUCCESS) {
  console.log('Data is valid:', result.data);
} else {
  console.log('Request failed:', result.message);
}
```

### Retry with Error Handling
```typescript
const result = await safeRequest({
  url: '/users/1',
  method: 'GET',
  guard: isUser,
  retry: {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential'
  }
});

if (result.status === Status.SUCCESS) {
  console.log('Request succeeded:', result.data);
} else {
  console.error(`Request failed: ${result.message}`);
}
```

### Error Handling

The library provides detailed error messages and multiple error handling strategies:

### Best Practices for Error Handling

1. **Always check the status first**:
   ```typescript
   if (result.status === Status.SUCCESS) {
     // Handle success
   } else {
     // Handle error
   }
   ```

2. **Handle different error types appropriately**:
   ```typescript
   if (result.status === Status.ERROR) {
     switch (result.code) {
       case 404:
         // Handle not found
         break;
       case 500:
         // Handle server errors
         break;
     }
   }
   ```

3. **Use tolerance mode for graceful degradation**:
   ```typescript
   const result = await safeGet({ 
     guard: isUser,
     tolerance: true 
   })('/users/1');
   
   if (result.status === Status.SUCCESS) {
     // Use data confidently
   } else {
     // Handle error
   }
   ```

4. **Use detailed error messages**:
   ```typescript
   const result = await safeGet({ 
     guard: isUser,
     onValidationError: (errors) => {
       errors.forEach(error => {
         console.error(`Validation failed: ${error}`);
       });
     }
   })('/users/1');
   ```

## API Patterns

### Pattern 1: Curried Functions

Simple, functional approach:

```typescript
import { safeGet, safePost } from 'guardz-axios';

const getUser = safeGet({ guard: isUser });
const createUser = safePost({ guard: isUser });

const result = await getUser('/users/1');
if (result.status === Status.SUCCESS) {
  console.log('User:', result.data);
}
```

### Pattern 2: Configuration-first

Full control over request configuration:

```typescript
import { safeRequest } from 'guardz-axios';

const result = await safeRequest({
  url: '/users/1',
  method: 'GET',
  guard: isUser,
  timeout: 5000,
  retry: {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential'
  }
});

if (result.status === Status.SUCCESS) {
  console.log('User:', result.data);
}
```

### Pattern 3: Fluent API Builder

Chainable, readable API:

```typescript
import { safe } from 'guardz-axios';

const result = await safe()
  .get('/users/1')
  .guard(isUser)
  .timeout(5000)
  .retry({ attempts: 3, delay: 1000 })
  .execute();

if (result.status === Status.SUCCESS) {
  console.log('User:', result.data);
}
```

### Pattern 4: Context/Provider

Shared configuration across requests:

```typescript
import { createSafeApiContext } from 'guardz-axios';

const api = createSafeApiContext({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  defaultTolerance: true
});

const result = await api.get('/users/1', { guard: isUser });
if (result.status === Status.SUCCESS) {
  console.log('User:', result.data);
}
```

## Advanced Features

### Tolerance Mode

Handle invalid responses gracefully:

```typescript
const result = await safeGet({
  guard: isUser,
  tolerance: true,
  onError: (error, context) => {
    console.warn(`Validation warning: ${error}`);
  }
})('/users/1');

if (result.status === Status.SUCCESS) {
  console.log('User:', result.data);
} else {
  console.log('Request failed:', result.message);
}
```

### Retry Logic

Automatic retry with exponential backoff:

```typescript
const result = await safeGet({
  guard: isUser,
  retry: {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential',
    retryOn: (error) => {
      // Custom retry logic
      return error.message.includes('network');
    }
  }
})('/users/1');

if (result.status === Status.SUCCESS) {
  console.log('User:', result.data);
}
```

### Custom Axios Instance

Use your own Axios configuration:

```typescript
import axios from 'axios';

const customAxios = axios.create({
  baseURL: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' }
});

const result = await safeGet({
  guard: isUser,
  axiosInstance: customAxios
})('/users/1');

if (result.status === Status.SUCCESS) {
  console.log('User:', result.data);
}
```

## Type Safety

### Automatic Type Inference

```typescript
const result = await safeGet({ guard: isUser })('/users/1');

if (result.status === Status.SUCCESS) {
  // TypeScript knows this is User
  console.log(result.data.name); // ✅ Type-safe
  console.log(result.data.email); // ✅ Type-safe
}
```

### Type Guards

```typescript
import { isType, isString, isNumber } from 'guardz';

const isUser = isType<User>({
  id: isNumber,
  name: isString,
  email: isString,
});

const result = await safeGet({ guard: isUser })('/users/1');
```

## Examples

See the [examples](./examples) directory for complete working examples:

- [Basic Usage](./examples/basic-usage.ts)
- [Advanced Patterns](./examples/advanced-patterns.ts)
- [Quick Demo](./examples/quick-demo.ts)
- [Error Handling Demo](./examples/error-handling-demo.ts)

## Sponsors

Support this project by becoming a sponsor:

- [GitHub Sponsors](https://github.com/thiennp)
- [Open Collective](https://opencollective.com/guardz-axios)
- [Ko-fi](https://ko-fi.com/nguyenphongthien)
- [Tidelift](https://tidelift.com/funding/github/npm/guardz)
- [Liberapay](https://liberapay.com/~1889616)
- [IssueHunt](https://issuehunt.io/r/nguyenphongthien)
- [Custom Sponsorship](https://github.com/thiennp/guardz-axios#sponsors)

## License

MIT 