// Precomputed powers for performance
const POWERS_OF_10 = [1, 10, 100, 1000, 10000, 100000, 1000000]
const POWERS_OF_26 = [1, 26, 676, 17576, 456976, 11881376, 308915776]

// Maximum valid index in the sequence
const MAX_N = POWERS_OF_10.map((p10, L) => p10 * POWERS_OF_26[6 - L]).reduce((a, b) => a + b) - 1

/**
 * Generates the nth DMV license plate in the sequence.
 * 
 * Sequence: 000000, 000001, ..., 999999, 00000A, 00001A, ..., 99999Z, 0000AA, ...
 * 
 * The sequence is organized in blocks by trailing letter count L:
 * - L=0: 000000-999999 (1M plates, digits only)
 * - L=1: 00000A-99999Z (2.6M plates, 5 digits + 1 letter)
 * - L=2: 0000AA-9999ZZ (6.76M plates, 4 digits + 2 letters)
 * - L=k: 10^(6-k) * 26^k plates per block
 * 
 * @param n - Zero-based index of the plate to generate
 * @returns The plate string (always 6 characters)
 * @throws Error if n is negative, non-integer, or exceeds sequence range
 * @complexity O(1) - no loops over n, direct mathematical calculation
 */
export function nthPlate(n: number): string {
  validateInput(n)
  
  // Find which block L contains index n using cumulative block sizes
  const blockInfo = findBlock(n)
  const { L, blockStart } = blockInfo
  
  // Calculate position within the block
  const offsetInBlock = n - blockStart
  
  // Generate the plate components
  const numDigits = 6 - L
  const numPlatesPerLetterCombo = POWERS_OF_10[numDigits]
  const numPrefix = offsetInBlock % numPlatesPerLetterCombo
  const letterSuffix = indexToLetters(Math.floor(offsetInBlock / numPlatesPerLetterCombo), L)
  
  // Combine with zero-padding (handle numDigits=0 case)
  const paddedNum = numDigits === 0 ? '' : numPrefix.toString().padStart(numDigits, '0')
  return paddedNum + letterSuffix
}

/**
 * Validates that input is a safe non-negative integer within sequence range.
 * 
 * @param n - The input to validate
 * @throws Error if n is invalid or out of range
 */
function validateInput(n: number): void {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('Input must be a non-negative integer')
  }
  if (n > Number.MAX_SAFE_INTEGER) {
    throw new Error('Input exceeds safe integer range')
  }
  if (n > MAX_N) {
    throw new Error('Index exceeds maximum plate sequence range')
  }
}

/**
 * Finds which block (by trailing letter count L) contains index n.
 * Uses precomputed powers for O(1) performance.
 * 
 * @param n - The index to locate
 * @returns Block info with L and starting index
 */
function findBlock(n: number): { L: number, blockStart: number } {
  let cumulativeSize = 0
  
  for (let L = 0; L <= 6; L++) {
    const blockSize = POWERS_OF_10[6 - L] * POWERS_OF_26[L]
    
    if (n < cumulativeSize + blockSize) {
      return { L, blockStart: cumulativeSize }
    }
    
    cumulativeSize += blockSize
  }
  
  // Should never reach here due to validateInput check
  throw new Error('Index exceeds maximum plate sequence range')
}

/**
 * Converts a letter index to base-26 representation with fixed length.
 * Maps 0→A, 1→B, ..., 25→Z, 26→AA, 27→AB, etc.
 * 
 * @param letterIdx - The letter combination index to convert
 * @param length - Fixed length of the result (number of letters)
 * @returns Base-26 string representation (e.g., "AA", "AB", "BA")
 */
function indexToLetters(letterIdx: number, length: number): string {
  if (length === 0) return ''
  
  let result = ''
  let remaining = letterIdx
  
  for (let i = 0; i < length; i++) {
    const digit = remaining % 26
    result = String.fromCharCode(65 + digit) + result // 65 = 'A'
    remaining = Math.floor(remaining / 26)
  }
  
  return result
}
