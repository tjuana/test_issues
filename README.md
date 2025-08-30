# DMV & Network Utilities

TypeScript utilities for DMV plate generation and bounded-concurrency fetching.

## Requirements

- Node.js 18+ 
- TypeScript 5+

## Usage

### DMV Plate Generator
```typescript
import { nthPlate } from './src/dmv/nthPlate.js'

console.log(nthPlate(0))        // "000000"
console.log(nthPlate(999999))   // "999999" 
console.log(nthPlate(1000000))  // "00000A"
```

### Bounded Concurrency Fetcher
```typescript
import { fetchAll } from './src/net/fetchAll.js'

const urls = ['https://api1.com', 'https://api2.com', 'https://api3.com']
const results = await fetchAll(urls, 2) // max 2 concurrent
```

## Commands

```bash
npm run test        # Run tests
npm run test:ui     # Interactive test UI
npm run typecheck   # Type checking
```
