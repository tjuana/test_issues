# DMV & Network Utilities

TypeScript utilities for DMV plate generation and bounded-concurrency fetching.

## Requirements

- Node.js 18+ 
- TypeScript 5+

## Features

### DMV Plate Generator (`nthPlate`)
- **O(1) complexity** - direct mathematical calculation, no loops over n
- **Complete sequence coverage** - handles 501M+ plates (000000 to ZZZZZZ)
- **Strict validation** - rejects invalid inputs with clear error messages

### Bounded Concurrency Fetcher (`fetchAll`)
- **Order preservation** - results maintain input array order
- **Efficient scheduling** - O(1) task scheduling, no array scans on completion
- **Error aggregation** - collects all failures, provides detailed error info
- **Pool behavior** - starts new tasks immediately when slots free up

## Usage

### DMV Plate Generator
```typescript
import { nthPlate } from './src/dmv/nthPlate.js'

// Generate plates for database seeding
const plates = Array.from({ length: 1000 }, (_, i) => nthPlate(i))
// ["000000", "000001", "000002", ...]

// Generate specific plate by index
const plateForUser = nthPlate(1000000)  // "00000A"

// Validate plate sequence boundaries
const lastPlate = nthPlate(501363135)   // "ZZZZZZ" (last valid)
```

### Bounded Concurrency Fetcher
```typescript
import { fetchAll } from './src/net/fetchAll.js'

// Fetch multiple APIs with concurrency control
const apiUrls = ['https://api1.com/users', 'https://api2.com/posts', 'https://api3.com/comments']
const responses = await fetchAll(apiUrls, 2) // max 2 concurrent

// With custom fetch for retry logic
const fetchWithRetry = (url: string) => 
  fetch(url).catch(() => fetch(url)) // simple retry
const results = await fetchAll(apiUrls, 3, fetchWithRetry)

// Robust error handling
try {
  const data = await fetchAll(apiUrls, 2)
  return data.map(response => response.json())
} catch (error) {
  if (error instanceof AggregateError) {
    const failedIndexes = error.failed.map(f => f.index)
    throw new Error(`Failed to fetch ${failedIndexes.length} APIs: ${failedIndexes}`)
  }
}
```

## Commands

```bash
npm run test        # Run tests
npm run test:ui     # Interactive test UI
npm run typecheck   # Type checking
```

## Architecture

- **Pure functions** - no side effects, deterministic behavior
- **Strong typing** - TypeScript strict mode, comprehensive type safety
- **Zero dependencies** - only dev dependencies (vitest, typescript)
- **ES2020 modules** - modern JavaScript, Node 18/20 compatible
