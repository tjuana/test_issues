import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchAll } from './fetchAll'

describe('fetchAll', () => {
  let mockFetch: (url: string) => Promise<{ url: string, data: string }>
  let activeFetches: Set<string>
  let peakConcurrency: number
  let currentConcurrency: number

  beforeEach(() => {
    activeFetches = new Set()
    peakConcurrency = 0
    currentConcurrency = 0
    
    mockFetch = vi.fn().mockImplementation(async (url: string) => {
      activeFetches.add(url)
      currentConcurrency++
      peakConcurrency = Math.max(peakConcurrency, currentConcurrency)
      
      // Artificial delays to test concurrency behavior
      const delays: Record<string, number> = {
        'fast': 10,
        'medium': 50,
        'slow': 100,
        'error': 30
      }
      
      await new Promise(resolve => setTimeout(resolve, delays[url] || 20))
      
      activeFetches.delete(url)
      currentConcurrency--
      
      if (url === 'error') {
        throw new Error(`Failed to fetch ${url}`)
      }
      
      return { url, data: `response-${url}` }
    })
  })

  describe('order preservation', () => {
    it('should preserve order despite varying response times', async () => {
      const urls = ['slow', 'fast', 'medium']
      const results = await fetchAll(urls, 3, mockFetch)
      
      expect(results).toHaveLength(3)
      expect(results[0]).toEqual({ url: 'slow', data: 'response-slow' })
      expect(results[1]).toEqual({ url: 'fast', data: 'response-fast' })
      expect(results[2]).toEqual({ url: 'medium', data: 'response-medium' })
    })

    it('should preserve order with limited concurrency', async () => {
      const urls = ['slow', 'fast', 'medium', 'fast']
      const results = await fetchAll(urls, 2, mockFetch)
      
      expect(results).toHaveLength(4)
      expect(results.map(r => r.url)).toEqual(['slow', 'fast', 'medium', 'fast'])
    })
  })

  describe('concurrency control', () => {
    it('should never exceed maxConcurrency', async () => {
      const urls = ['slow', 'slow', 'slow', 'slow', 'slow']
      await fetchAll(urls, 2, mockFetch)
      
      expect(peakConcurrency).toBe(2)
      expect(peakConcurrency).toBeLessThanOrEqual(2)
    })

    it('should start tasks ASAP when slots become available', async () => {
      const urls = ['medium', 'fast', 'medium', 'fast']
      const startTime = Date.now()
      
      await fetchAll(urls, 2, mockFetch)
      
      const duration = Date.now() - startTime
      // With maxConcurrency=2, should finish faster than sequential
      // Sequential would be ~140ms (50+10+50+10), concurrent should be ~100ms
      // Give extra margin for slower CI environments
      expect(duration).toBeLessThan(150)
      expect(peakConcurrency).toBe(2)
    })

    it('should handle maxConcurrency >= urls.length', async () => {
      const urls = ['fast', 'fast']
      await fetchAll(urls, 5, mockFetch)
      
      expect(peakConcurrency).toBe(2) // Only 2 URLs, so max 2 concurrent
    })
  })

  describe('error handling', () => {
    it('should aggregate errors and reject with AggregateError', async () => {
      const urls = ['fast', 'error', 'medium', 'error']
      
      let caughtError: unknown
      try {
        await fetchAll(urls, 2, mockFetch)
      } catch (error) {
        caughtError = error
      }
      
      expect(caughtError).toBeInstanceOf(AggregateError)
      expect((caughtError as AggregateError).errors).toHaveLength(2)
      
      // Check that failed property contains index and error info
      const failed = (caughtError as AggregateError & { failed: { index: number, error: Error }[] }).failed
      expect(failed).toHaveLength(2)
      expect(failed[0].index).toBe(1)
      expect(failed[0].error).toBeInstanceOf(Error)
      expect(failed[1].index).toBe(3)
      expect(failed[1].error).toBeInstanceOf(Error)
    })

    it('should wait for all requests to settle before rejecting', async () => {
      const urls = ['slow', 'error', 'fast']
      const startTime = Date.now()
      
      try {
        await fetchAll(urls, 3, mockFetch)
      } catch (error) {
        const duration = Date.now() - startTime
        // Should wait for the slowest request (100ms) before rejecting
        // Give margin for CI timing variance
        expect(duration).toBeGreaterThan(80)
      }
    })

    it('should resolve successfully when no errors occur', async () => {
      const urls = ['fast', 'medium', 'fast']
      const results = await fetchAll(urls, 2, mockFetch)
      
      expect(results).toHaveLength(3)
      expect(results.every(r => r.url && r.data)).toBe(true)
    })

    it('should handle synchronous throws in fetchImpl', async () => {
      const syncThrowFetch = vi.fn().mockImplementation((url: string) => {
        if (url === 'sync-error') {
          throw new Error('Synchronous error')
        }
        return Promise.resolve({ url, data: `response-${url}` })
      })
      
      const urls = ['fast', 'sync-error', 'medium']
      
      let caughtError: unknown
      try {
        await fetchAll(urls, 2, syncThrowFetch)
      } catch (error) {
        caughtError = error
      }
      
      expect(caughtError).toBeInstanceOf(AggregateError)
      const failed = (caughtError as AggregateError & { failed: { index: number, error: Error }[] }).failed
      expect(failed).toHaveLength(1)
      expect(failed[0].index).toBe(1)
      expect(failed[0].error.message).toBe('Synchronous error')
    })
  })

  describe('edge cases', () => {
    it('should handle empty input array', async () => {
      const results = await fetchAll([], 2, mockFetch)
      expect(results).toEqual([])
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle single URL', async () => {
      const results = await fetchAll(['fast'], 1, mockFetch)
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({ url: 'fast', data: 'response-fast' })
    })
  })

  describe('input validation', () => {
    it('should reject invalid URLs parameter', async () => {
      await expect(fetchAll(null as unknown as string[], 2)).rejects.toThrow('URLs must be an array')
      await expect(fetchAll('not-array' as unknown as string[], 2)).rejects.toThrow('URLs must be an array')
    })

    it('should reject invalid maxConcurrency', async () => {
      await expect(fetchAll(['url'], 0)).rejects.toThrow('maxConcurrency must be a positive integer')
      await expect(fetchAll(['url'], -1)).rejects.toThrow('maxConcurrency must be a positive integer')
      await expect(fetchAll(['url'], 3.14)).rejects.toThrow('maxConcurrency must be a positive integer')
    })

    it('should use globalThis.fetch by default', async () => {
      // This test verifies the default parameter works
      const originalFetch = globalThis.fetch
      const mockGlobalFetch = vi.fn().mockResolvedValue({ url: 'test', data: 'test' })
      ;(globalThis as typeof globalThis & { fetch: typeof mockGlobalFetch }).fetch = mockGlobalFetch
      
      try {
        await fetchAll(['test'], 1)
        expect(mockGlobalFetch).toHaveBeenCalledWith('test')
      } finally {
        ;(globalThis as typeof globalThis & { fetch: typeof originalFetch }).fetch = originalFetch
      }
    })
  })
})
