# Examples

This directory contains examples demonstrating how to use guardz-axios effectively.

## Guardz Ecosystem

This library is part of the **Guardz ecosystem**:
- **[guardz](https://www.npmjs.com/package/guardz)** - Core type guard library
- **[guardz-generator](https://www.npmjs.com/package/guardz-generator)** - Auto-generate type guards from TypeScript interfaces
- **[guardz-axios](https://www.npmjs.com/package/guardz-axios)** - Type-safe HTTP client (this package)
- **[guardz-event](https://www.npmjs.com/package/guardz-event)** - Type-safe event handling

## Available Examples

### `quick-demo.ts`
A quick demonstration of all four API patterns:
- Curried Functions
- Fluent API Builder  
- Context/Provider
- Configuration-first

Perfect for getting started quickly.

### `basic-usage.ts`
Basic usage examples showing:
- Simple GET and POST requests
- Type guard validation
- Error handling
- Status checking

Great for beginners and simple use cases.

### `advanced-patterns.ts`
Comprehensive examples showing:
- All API patterns in detail
- Real-world usage scenarios
- Service class implementations
- Repository pattern examples
- Error handling strategies
- Retry logic configuration

Ideal for understanding advanced usage and best practices.

### `error-handling-demo.ts`
Detailed error handling examples:
- Validation errors
- Network errors
- Timeout errors
- HTTP status errors
- Tolerance mode
- Custom error handling

Essential for production applications.

### `ecosystem-integration.ts` ⭐ **NEW**
Complete ecosystem integration demonstrating:
- Integration with all guardz ecosystem components
- Type-safe HTTP requests with guardz-axios
- Type-safe event handling with guardz-event
- Automatic type guard generation (simulated)
- Event-driven architecture
- Comprehensive error handling
- Real-world API and event patterns

**This is the most comprehensive example showing how all ecosystem components work together.**

## Running Examples

These examples are designed to be readable TypeScript code. To run them:

1. Install dependencies: `npm install`
2. Uncomment the execution line at the bottom of each file
3. Run with: `npx ts-node examples/<filename>.ts`

## Import Note

Examples use relative imports (`../src/index`) for demonstration purposes. In your actual project, use:

```typescript
import { safeGet, safe, createSafeApiContext } from 'guardz-axios';
``` 