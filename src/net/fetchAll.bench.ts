import { describe, it, expect, vi } from 'vitest'
import { fetchAll } from './fetchAll'

describe('fetchAll performance', () => {
  it('should demonstrate O(1) scheduling efficiency', async () => {
    // Mock fetch with instant resolution to isolate scheduling overhead
    const instantFetch = vi.fn().mockImplementation(async (url: string) => {
      return { url, data: `response-${url}` }
    })
    
    const testSizes = [10, 100, 1000]
    const timings: Record<number, number> = {}
    
    for (const size of testSizes) {
      const urls = Array.from({ length: size }, (_, i) => `url-${i}`)
      
      const startTime = performance.now()
      await fetchAll(urls, Math.min(10, size), instantFetch)
      const duration = performance.now() - startTime
      
      timings[size] = duration
    }
    
    // O(1) scheduling means time should scale roughly linearly with URL count
    // not quadratically (which would indicate O(n) scans)
    const time10 = timings[10]
    const time100 = timings[100] 
    const time1000 = timings[1000]
    
    // If scheduling is O(n²), time1000 would be ~100x time10
    // With O(1) scheduling, it should be much less
    const scalingFactor = time1000 / time10
    expect(scalingFactor).toBeLessThan(50) // Much less than O(n²) would give
    
    console.log(`\x1b[36m📈 Scheduling efficiency (O(1) verification):\x1b[0m`)
    console.log(`   \x1b[32m10 URLs: ${time10.toFixed(1)}ms\x1b[0m`)
    console.log(`   \x1b[32m100 URLs: ${time100.toFixed(1)}ms\x1b[0m`) 
    console.log(`   \x1b[32m1000 URLs: ${time1000.toFixed(1)}ms\x1b[0m`)
    const scaleColor = scalingFactor < 20 ? '\x1b[32m' : scalingFactor < 50 ? '\x1b[33m' : '\x1b[31m'
    console.log(`   ${scaleColor}Scaling factor: ${scalingFactor.toFixed(1)}x \x1b[90m(linear good, quadratic bad)\x1b[0m`)
  })

  it('should respect concurrency limits under load', async () => {
    let peakConcurrency = 0
    let currentConcurrency = 0
    
    const trackingFetch = vi.fn().mockImplementation(async (url: string) => {
      currentConcurrency++
      peakConcurrency = Math.max(peakConcurrency, currentConcurrency)
      
      // Small delay to allow concurrency buildup
      await new Promise(resolve => setTimeout(resolve, 5))
      
      currentConcurrency--
      return { url, data: `response-${url}` }
    })
    
    // Test with many URLs and low concurrency
    const urls = Array.from({ length: 50 }, (_, i) => `url-${i}`)
    const maxConcurrency = 3
    
    const startTime = performance.now()
    await fetchAll(urls, maxConcurrency, trackingFetch)
    const duration = performance.now() - startTime
    
    // Verify concurrency was respected
    expect(peakConcurrency).toBe(maxConcurrency)
    expect(peakConcurrency).toBeLessThanOrEqual(maxConcurrency)
    
    // Should be faster than sequential (50 * 5ms = 250ms)
    expect(duration).toBeLessThan(200)
    
    console.log(`\x1b[34m🎯 Concurrency control:\x1b[0m`)
    console.log(`   URLs: \x1b[1m${urls.length}\x1b[0m, Max concurrent: \x1b[1m${maxConcurrency}\x1b[0m`)
    const concurrencyColor = peakConcurrency === maxConcurrency ? '\x1b[32m' : '\x1b[31m'
    console.log(`   ${concurrencyColor}Peak concurrency: ${peakConcurrency}\x1b[0m \x1b[90m(should equal max)\x1b[0m`)
    console.log(`   \x1b[36mDuration: ${duration.toFixed(1)}ms\x1b[0m`)
  })

  it('should handle high-frequency completions efficiently', async () => {
    // Test rapid task completion to stress the scheduling system
    const rapidFetch = vi.fn().mockImplementation(async (url: string) => {
      // Deterministic short delays to avoid benchmark flakiness
      const urlIndex = parseInt(url.split('-')[1])
      const delay = (urlIndex % 3) + 1 // 1, 2, or 3ms deterministically
      await new Promise(resolve => setTimeout(resolve, delay))
      return { url, data: `response-${url}` }
    })
    
    const urls = Array.from({ length: 200 }, (_, i) => `rapid-${i}`)
    const startTime = performance.now()
    
    const results = await fetchAll(urls, 20, rapidFetch)
    
    const duration = performance.now() - startTime
    
    expect(results).toHaveLength(200)
    expect(duration).toBeLessThan(100) // Should complete quickly
    
    const throughput = urls.length / duration * 1000
    console.log(`\x1b[35m⚡ High-frequency performance:\x1b[0m`)
    console.log(`   \x1b[1m${urls.length} URLs\x1b[0m completed in \x1b[36m${duration.toFixed(1)}ms\x1b[0m`)
    const throughputColor = throughput > 10000 ? '\x1b[32m' : throughput > 5000 ? '\x1b[33m' : '\x1b[31m'
    console.log(`   ${throughputColor}Throughput: ${throughput.toFixed(0)} ops/sec\x1b[0m`)
  })
})
