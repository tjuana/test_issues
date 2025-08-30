import { describe, it, expect } from 'vitest'
import { nthPlate } from './nthPlate'

describe('nthPlate', () => {
  describe('numeric block (L=0): 000000-999999', () => {
    it('should return 000000 for n=0', () => {
      expect(nthPlate(0)).toBe('000000')
    })

    it('should return correct early numeric plates', () => {
      expect(nthPlate(1)).toBe('000001')
      expect(nthPlate(42)).toBe('000042')
      expect(nthPlate(12345)).toBe('012345')
    })

    it('should return 999999 for last numeric plate (n=999999)', () => {
      expect(nthPlate(999999)).toBe('999999')
    })
  })

  describe('L=1 block: 00000A-99999Z (1M plates)', () => {
    it('should start L=1 block correctly', () => {
      expect(nthPlate(1000000)).toBe('00000A')
      expect(nthPlate(1000001)).toBe('00001A')
      expect(nthPlate(1000025)).toBe('00025A')
    })

    it('should handle letter progression in L=1', () => {
      expect(nthPlate(1000000)).toBe('00000A') // first A
      expect(nthPlate(1100000)).toBe('00000B') // first B  
      expect(nthPlate(1200000)).toBe('00000C') // first C
    })

    it('should end L=1 block correctly', () => {
      expect(nthPlate(1099999)).toBe('99999A') // last A
      expect(nthPlate(3599999)).toBe('99999Z') // last Z, end of L=1
    })
  })

  describe('L=2 block: 0000AA-9999ZZ (26M plates)', () => {
    it('should start L=2 block correctly after L=1', () => {
      // L=1 ends at n=3,599,999 (26 * 100,000 - 1 + 1,000,000)
      // L=2 starts at n=3,600,000
      expect(nthPlate(3600000)).toBe('0000AA')
      expect(nthPlate(3600001)).toBe('0001AA')
    })

    it('should handle AA->AB->...->AZ->BA progression', () => {
      expect(nthPlate(3600000)).toBe('0000AA') // AA start (letterIdx=0)
      expect(nthPlate(3610000)).toBe('0000AB') // AB start (letterIdx=1)  
      expect(nthPlate(3860000)).toBe('0000BA') // BA start (letterIdx=26)
    })

    it('should handle L=2 mid-range correctly', () => {
      // Test some middle values to verify base-26 conversion
      expect(nthPlate(3600000 + 10000)).toBe('0000AB') // letterIdx=1
      expect(nthPlate(3600000 + 260000)).toBe('0000BA') // letterIdx=26
    })
  })

  describe('L=3 block: 000AAA-999ZZZ', () => {
    it('should start L=3 block correctly', () => {
      // L=0: 1M, L=1: 2.6M, L=2: 6.76M (10^4 * 26^2)
      // L=3 starts at 1M + 2.6M + 6.76M = 10.36M
      const l3Start = 10360000
      expect(nthPlate(l3Start)).toBe('000AAA')
      expect(nthPlate(l3Start + 1)).toBe('001AAA')
    })
  })

  describe('boundary transitions and block calculations', () => {
    it('should handle transition from L=0 to L=1 precisely', () => {
      expect(nthPlate(999999)).toBe('999999')   // last L=0
      expect(nthPlate(1000000)).toBe('00000A')  // first L=1
    })

    it('should handle transition from L=1 to L=2 precisely', () => {
      expect(nthPlate(3599999)).toBe('99999Z')  // last L=1
      expect(nthPlate(3600000)).toBe('0000AA')  // first L=2
    })

    it('always returns length 6', () => {
      expect(nthPlate(0).length).toBe(6)
      expect(nthPlate(1_000_000).length).toBe(6)
    })

    it('rejects beyond max sequence', () => {
      // last index of the sequence:
      // sum_{L=0..6} 10^(6-L)*26^L - 1
      const max =
        1_000_000
      + 26 * 100_000
      + 26**2 * 10_000
      + 26**3 * 1_000
      + 26**4 * 100
      + 26**5 * 10
      + 26**6 * 1
      - 1
      expect(nthPlate(max)).toBe('ZZZZZZ')
      expect(() => nthPlate(max + 1)).toThrow('Index exceeds maximum plate sequence range')
    })
  })

  describe('input validation', () => {
    it('should reject negative numbers', () => {
      expect(() => nthPlate(-1)).toThrow('Input must be a non-negative integer')
    })

    it('should reject non-integers', () => {
      expect(() => nthPlate(3.14)).toThrow('Input must be a non-negative integer')
      expect(() => nthPlate(NaN)).toThrow('Input must be a non-negative integer')
      expect(() => nthPlate(Infinity)).toThrow('Input must be a non-negative integer')
    })

    it('should reject unsafe large numbers', () => {
      expect(() => nthPlate(Number.MAX_SAFE_INTEGER + 1)).toThrow('Input exceeds safe integer range')
    })
  })

  describe('mathematical correctness spot checks', () => {
    it('should verify L=4 block start', () => {
      // L=0: 1M, L=1: 2.6M, L=2: 6.76M, L=3: 17.576M (10^3 * 26^3)
      // L=4 starts at 1M + 2.6M + 6.76M + 17.576M = 27.936M
      const l4Start = 27936000
      expect(nthPlate(l4Start)).toBe('00AAAA')
    })

    it('should verify lexicographic ordering within blocks', () => {
      // Within L=2 block, verify AA < AB < ... < AZ < BA
      const l2Start = 3600000
      expect(nthPlate(l2Start)).toBe('0000AA')          // letterIdx=0
      expect(nthPlate(l2Start + 10000)).toBe('0000AB')  // letterIdx=1
      expect(nthPlate(l2Start + 250000)).toBe('0000AZ') // letterIdx=25
      expect(nthPlate(l2Start + 260000)).toBe('0000BA') // letterIdx=26
    })
  })
})
