import { describe, it, expect } from 'vitest';
import { Bag } from '../engine/Bag';
import type { PieceType } from '../engine/types';

const ALL_TYPES: PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

describe('Bag (7-bag randomizer)', () => {
  // --- next() ---

  describe('next()', () => {
    it('returns a valid PieceType', () => {
      const bag = new Bag();
      const piece = bag.next();
      expect(ALL_TYPES).toContain(piece);
    });

    it('returns valid PieceTypes for 20 consecutive draws', () => {
      const bag = new Bag();
      for (let i = 0; i < 20; i++) {
        expect(ALL_TYPES).toContain(bag.next());
      }
    });
  });

  // --- 7-bag distribution guarantee ---

  describe('7-bag distribution', () => {
    it('all 7 piece types appear exactly once in each bag of 7 draws', () => {
      const bag = new Bag();
      const first7 = Array.from({ length: 7 }, () => bag.next());
      const uniqueFirst7 = new Set(first7);
      expect(uniqueFirst7.size).toBe(7);
      for (const t of ALL_TYPES) {
        expect(uniqueFirst7.has(t)).toBe(true);
      }
    });

    it('calling next() 14 times (two bags): each set of 7 contains all 7 piece types', () => {
      const bag = new Bag();
      const first7 = Array.from({ length: 7 }, () => bag.next());
      const second7 = Array.from({ length: 7 }, () => bag.next());

      expect(new Set(first7).size).toBe(7);
      expect(new Set(second7).size).toBe(7);
    });

    it('no pure randomness drought: in 100 bags (700 draws), every window of 7 contains all types', () => {
      const bag = new Bag();
      const draws: PieceType[] = [];
      for (let i = 0; i < 700; i++) {
        draws.push(bag.next());
      }
      // Verify each 7-draw window starting at multiples of 7
      for (let i = 0; i < 700; i += 7) {
        const window = draws.slice(i, i + 7);
        const windowSet = new Set(window);
        expect(windowSet.size).toBe(7);
      }
    });
  });

  // --- peek() ---

  describe('peek()', () => {
    it('peek(3) returns exactly 3 PieceTypes', () => {
      const bag = new Bag();
      expect(bag.peek(3).length).toBe(3);
    });

    it('peek(3) does not consume pieces — next() still returns peek[0]', () => {
      const bag = new Bag();
      const peeked = bag.peek(3);
      expect(bag.next()).toBe(peeked[0]);
      expect(bag.next()).toBe(peeked[1]);
      expect(bag.next()).toBe(peeked[2]);
    });

    it('peek(7) returns all 7 types with no duplicates within one bag', () => {
      const bag = new Bag();
      const peeked = bag.peek(7);
      expect(peeked.length).toBe(7);
      expect(new Set(peeked).size).toBe(7);
    });

    it('peek(14) covers two full bags — all 7 types appear in each group of 7', () => {
      const bag = new Bag();
      const peeked = bag.peek(14);
      expect(peeked.length).toBe(14);
      const first7 = new Set(peeked.slice(0, 7));
      const second7 = new Set(peeked.slice(7, 14));
      expect(first7.size).toBe(7);
      expect(second7.size).toBe(7);
    });

    it('peek returns valid PieceTypes', () => {
      const bag = new Bag();
      const peeked = bag.peek(5);
      for (const p of peeked) {
        expect(ALL_TYPES).toContain(p);
      }
    });
  });

  // --- reset() ---

  describe('reset()', () => {
    it('reset() flushes the queue — next() after reset still returns valid pieces', () => {
      const bag = new Bag();
      // Partially consume the bag
      bag.next();
      bag.next();
      bag.next();
      bag.reset();
      // Should still work correctly after reset
      for (let i = 0; i < 14; i++) {
        expect(ALL_TYPES).toContain(bag.next());
      }
    });

    it('after reset, the 7-bag guarantee still holds', () => {
      const bag = new Bag();
      bag.next();
      bag.next();
      bag.reset();
      const first7 = Array.from({ length: 7 }, () => bag.next());
      expect(new Set(first7).size).toBe(7);
    });
  });
});
