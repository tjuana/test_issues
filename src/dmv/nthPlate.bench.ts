import { describe, it, expect } from 'vitest'
import { nthPlate } from './nthPlate'

describe('nthPlate performance', () => {
  it('should handle large indices in O(L) time where L≤6', () => {
    const largeIndices = [
      0,
      999999,        // last L=0
      1000000,       // first L=1  
      3599999,       // last L=1
      3600000,       // first L=2
      10359999,      // last L=2
      501363135      // max valid (ZZZZZZ)
    ]
    
    const startTime = performance.now()
    
    // Run multiple times to get meaningful measurement
    for (let i = 0; i < 1000; i++) {
      for (const index of largeIndices) {
        nthPlate(index)
      }
    }
    
    const endTime = performance.now()
    const duration = endTime - startTime
    const opsPerMs = (1000 * largeIndices.length) / duration
    
    // Should be very fast - O(L) where L≤6 means constant time regardless of input magnitude n
    expect(duration).toBeLessThan(50) // 50ms for 7000 operations
    expect(opsPerMs).toBeGreaterThan(100) // >100 ops/ms
    
    console.log(`\x1b[32m✅ nthPlate performance: \x1b[1m${opsPerMs.toFixed(0)} ops/ms\x1b[0m \x1b[90m(${duration.toFixed(1)}ms for ${1000 * largeIndices.length} ops)\x1b[0m`)
  })

  it('should have consistent timing across different ranges', () => {
    const testCases = [
      { name: 'small (L=0)', indices: [0, 500000, 999999] },
      { name: 'medium (L=1)', indices: [1000000, 2000000, 3599999] },
      { name: 'large (L=2)', indices: [3600000, 5000000, 10359999] },
      { name: 'huge (L=6)', indices: [500000000, 501000000, 501363135] }
    ]
    
    const timings: Record<string, number> = {}
    
    for (const testCase of testCases) {
      const startTime = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        for (const index of testCase.indices) {
          nthPlate(index)
        }
      }
      
      const duration = performance.now() - startTime
      timings[testCase.name] = duration
    }
    
    // O(1) means timing should be similar regardless of input size
    const timingValues = Object.values(timings)
    const minTime = Math.min(...timingValues)
    const maxTime = Math.max(...timingValues)
    const variance = (maxTime - minTime) / minTime
    
    // Variance accounts for O(L) component where L ≤ 6 (block-finding + letter generation)
    // True complexity: O(L) where L is constant ≤ 6, independent of input magnitude n
    expect(variance).toBeLessThan(3.0) // reasonable for O(L) with small L
    
    console.log(`\x1b[36m📊 Timing consistency (O(L) where L≤6, independent of n):\x1b[0m`)
    Object.entries(timings).forEach(([name, time]) => {
      const color = time < 1 ? '\x1b[32m' : time < 2 ? '\x1b[33m' : '\x1b[31m'
      console.log(`   ${color}${name}: ${time.toFixed(1)}ms\x1b[0m`)
    })
    console.log(`\x1b[35m   Variance: ${(variance * 100).toFixed(1)}% \x1b[90m(reflects O(L) complexity, L≤6)\x1b[0m`)
  })
})
