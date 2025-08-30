/**
 * Fetches multiple URLs with bounded concurrency, preserving order.
 * 
 * Features:
 * - Preserves result order regardless of response timing
 * - Never exceeds maxConcurrency limit
 * - Starts new tasks ASAP when slots become available (pool behavior)
 * - Aggregates errors: waits for all to settle, then rejects with AggregateError
 * - O(1) scheduling - no array scans on task completion
 * - Protects against synchronous throws in fetchImpl
 * 
 * @param urls - Array of URLs to fetch
 * @param maxConcurrency - Maximum number of concurrent requests (clamped to urls.length)
 * @param fetchImpl - Fetch implementation (defaults to globalThis.fetch)
 * @returns Promise resolving to results array in original order
 * @throws AggregateError with .failed property containing {index, error}[] if any fail
 *         When errors occur, partial results are not returned - promise rejects entirely
 * @complexity O(1) per completion - uses index queue, no linear scans
 */
export async function fetchAll<T = Response>(
  urls: string[],
  maxConcurrency: number,
  fetchImpl: (url: string) => Promise<T> = globalThis.fetch as unknown as (url: string) => Promise<T>
): Promise<T[]> {
  validateInputs(urls, maxConcurrency)
  
  // Early exit for empty input
  if (urls.length === 0) {
    return []
  }
  
  // Clamp maxConcurrency to actual URL count for efficiency
  const effectiveMaxConcurrency = Math.min(maxConcurrency, urls.length)
  
  return new Promise((resolve, reject) => {
    const results: T[] = new Array(urls.length)
    const failedRequests: { index: number, error: Error }[] = []
    let completedCount = 0
    let inFlightCount = 0
    let nextUrlIndex = 0
    
    const startNextBatch = (): void => {
      while (inFlightCount < effectiveMaxConcurrency && nextUrlIndex < urls.length) {
        const urlIndex = nextUrlIndex
        nextUrlIndex++
        inFlightCount++
        
        executeRequest(urlIndex)
      }
    }
    
    const executeRequest = async (urlIndex: number): Promise<void> => {
      try {
        // Protect against synchronous throws in fetchImpl
        const result = await Promise.resolve(fetchImpl(urls[urlIndex]))
        results[urlIndex] = result
      } catch (error) {
        failedRequests.push({ index: urlIndex, error: error as Error })
      } finally {
        inFlightCount--
        completedCount++
        if (completedCount === urls.length) {
          handleAllCompleted()
        } else {
          startNextBatch()
        }
      }
    }
    
    const handleAllCompleted = (): void => {
      if (failedRequests.length > 0) {
        const aggregateError = new AggregateError(
          failedRequests.map(f => f.error),
          `${failedRequests.length} of ${urls.length} requests failed`
        )
        Object.assign(aggregateError, { failed: failedRequests })
        reject(aggregateError)
      } else {
        resolve(results)
      }
    }
    
    // Start initial batch
    startNextBatch()
  })
}

/**
 * Validates input parameters for fetchAll.
 * 
 * @param urls - URLs array to validate
 * @param maxConcurrency - Concurrency limit to validate
 * @throws Error if inputs are invalid
 */
function validateInputs(urls: string[], maxConcurrency: number): void {
  if (!Array.isArray(urls)) {
    throw new Error('URLs must be an array')
  }
  
  if (!Number.isInteger(maxConcurrency) || maxConcurrency <= 0) {
    throw new Error('maxConcurrency must be a positive integer')
  }
}
