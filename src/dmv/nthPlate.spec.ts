import { describe, it, expect } from 'vitest'
import { nthPlate } from './nthPlate.js'

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
      expect(nthPlate(1999999)).toBe('99999A') // last A
      expect(nthPlate(2599999)).toBe('99999Z') // last Z, end of L=1
    })
  })

  describe('L=2 block: 0000AA-9999ZZ (26M plates)', () => {
    it('should start L=2 block correctly after L=1', () => {
      // L=1 ends at n=2,599,999 (26 * 100,000 - 1 + 1,000,000)
      // L=2 starts at n=2,600,000
      expect(nthPlate(2600000)).toBe('0000AA')
      expect(nthPlate(2600001)).toBe('0001AA')
    })

    it('should handle AA->AB->...->AZ->BA progression', () => {
      expect(nthPlate(2600000)).toBe('0000AA') // AA start
      expect(nthPlate(2610000)).toBe('0000AB') // AB start  
      expect(nthPlate(2700000)).toBe('0000BA') // BA start
    })

    it('should handle L=2 mid-range correctly', () => {
      // Test some middle values to verify base-26 conversion
      expect(nthPlate(2600000 + 10000)).toBe('0000AB') // second letter
      expect(nthPlate(2600000 + 260000)).toBe('0000BA') // rollover to B*
    })
  })

  describe('L=3 block: 000AAA-999ZZZ', () => {
    it('should start L=3 block correctly', () => {
      // L=0: 1M, L=1: 26M, L=2: 26M*10 = 260M  
      // L=3 starts at 1M + 26M + 260M = 287M
      const l3Start = 1000000 + 26000000 + 260000000 // 287,000,000
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
      expect(nthPlate(2599999)).toBe('99999Z')  // last L=1
      expect(nthPlate(2600000)).toBe('0000AA')  // first L=2
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
      // L=0: 1M, L=1: 26M, L=2: 260M, L=3: 2.6B
      // L=4 starts at 1M + 26M + 260M + 2.6B = ~2.887B
      const l4Start = 1000000 + 26000000 + 260000000 + 2600000000
      expect(nthPlate(l4Start)).toBe('00AAAA')
    })

    it('should verify lexicographic ordering within blocks', () => {
      // Within L=2 block, verify AA < AB < ... < AZ < BA
      const l2Start = 2600000
      expect(nthPlate(l2Start)).toBe('0000AA')
      expect(nthPlate(l2Start + 10000)).toBe('0000AB')
      expect(nthPlate(l2Start + 250000)).toBe('0000AZ')
      expect(nthPlate(l2Start + 260000)).toBe('0000BA')
    })
  })
})
