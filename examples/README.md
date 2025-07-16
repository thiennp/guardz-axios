# Examples

This directory contains examples demonstrating how to use guardz-axios effectively.

## Available Examples

### `quick-demo.ts`
A quick demonstration of all four API patterns:
- Curried Functions
- Fluent API Builder  
- Context/Provider
- Configuration-first

Perfect for getting started quickly.

### `advanced-patterns.ts`
Comprehensive examples showing:
- All API patterns in detail
- Real-world usage scenarios
- Service class implementations
- Repository pattern examples
- Error handling strategies
- Retry logic configuration

Ideal for understanding advanced usage and best practices.

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