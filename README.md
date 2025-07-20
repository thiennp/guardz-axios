# Guardz Axios

A type-safe HTTP client built on top of Axios with runtime validation using [guardz](https://github.com/thiennp/guardz) 1.7.0+.

## Features

- **Type-safe HTTP requests** with runtime validation
- **Multiple API patterns** for different use cases
- **Comprehensive error handling** with detailed feedback
- **Retry logic** with configurable backoff strategies
- **Tolerance mode** for graceful degradation
- **Zero dependencies** beyond axios and guardz

## Installation

```bash
npm install guardz-axios guardz axios
```

## Guardz 1.7.0+ Features

This library is built on top of [guardz 1.7.0+](https://github.com/thiennp/guardz) and leverages its latest features:

- **Enhanced Type Guards**: Improved `isType`, `isOneOf`, and other type guards for better validation
- **Generic Type Guards**: Use `isGeneric` for creating reusable validation patterns
- **Asserted Type Guards**: Use `isAsserted` for external library types without runtime validation
- **Structured Error Handling**: Detailed, field-specific error messages with property paths
- **Tolerance Mode**: Graceful handling of validation failures with `guardWithTolerance`
- **Composite Type Guards**: Support for intersection types and inheritance patterns

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

## Result Type

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

### Structured Error Handling

Guardz 1.7.0+ provides detailed, field-specific error messages:

```typescript
import { isType, isString, isNumber } from 'guardz';

const isUser = isType<User>({
  id: isNumber,
  name: isString,
  email: isString,
});

const errors: string[] = [];
const config = {
  identifier: 'user',
  callbackOnError: (error: string) => errors.push(error),
};

const invalidUser = { id: 'not-a-number', name: 'John', email: 'invalid-email' };
const result = isUser(invalidUser, config);
// errors contains: ['Expected user.id ("not-a-number") to be "number"']
```

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

4. **Leverage structured error messages**:
   ```typescript
   const result = await safeGet({ 
     guard: isUser,
     onValidationError: (errors) => {
       errors.forEach(error => {
         console.error(`Validation failed: ${error}`);
         // Log to monitoring service
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

### Generic Type Guards

```typescript
import { isGeneric, isString, isNumber, isType } from 'guardz';

// Create reusable type guards with semantic meaning
const isUserId = isGeneric(isNumber);
const isEmail = isGeneric(isString);
const isName = isGeneric(isString);

const isUser = isType<User>({
  id: isUserId,
  name: isName,
  email: isEmail,
});

const result = await safeGet({ guard: isUser })('/users/1');

if (result.status === Status.SUCCESS) {
  console.log('User:', result.data);
}
```

### Asserted Type Guards

For external library types without runtime validation:

```typescript
import { isAsserted } from 'guardz';

// For external API types
interface ExternalApiResponse {
  id: string;
  data: unknown;
}

const isExternalResponse = isAsserted<ExternalApiResponse>;

const result = await safeGet({ 
  guard: isExternalResponse 
})('/external-api/data');

if (result.status === Status.SUCCESS) {
  console.log('External data:', result.data);
}
```

## Examples

See the [examples](./examples) directory for complete working examples:

- [Basic Usage](./examples/basic-usage.ts)
- [Advanced Patterns](./examples/advanced-patterns.ts)
- [Quick Demo](./examples/quick-demo.ts)
- [Error Handling Demo](./examples/error-handling-demo.ts)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT 