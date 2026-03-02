import { describe, it, expect, beforeEach } from 'vitest';
import { Scorer } from '../engine/Scorer';

describe('Scorer', () => {
  let scorer: Scorer;

  beforeEach(() => {
    scorer = new Scorer();
  });

  // ─── Line clear scoring (no B2B, no T-spin, level 1) ───────────────────────

  describe('line clear scoring — no modifier, level 1', () => {
    it('1 line clear → 100', () => {
      const delta = scorer.calculateLineClearScore(1, 'none', false);
      expect(delta).toBe(100);
    });

    it('2 line clear → 300', () => {
      const delta = scorer.calculateLineClearScore(2, 'none', false);
      expect(delta).toBe(300);
    });

    it('3 line clear → 500', () => {
      const delta = scorer.calculateLineClearScore(3, 'none', false);
      expect(delta).toBe(500);
    });

    it('4 line clear (Tetris) → 800', () => {
      const delta = scorer.calculateLineClearScore(4, 'none', false);
      expect(delta).toBe(800);
    });
  });

  // ─── Level scaling ──────────────────────────────────────────────────────────

  describe('level scaling', () => {
    it('1 line at level 3 → 300 (100 × 3)', () => {
      scorer.level = 3;
      const delta = scorer.calculateLineClearScore(1, 'none', false);
      expect(delta).toBe(300);
    });

    it('4 lines at level 5 → 4000 (800 × 5)', () => {
      scorer.level = 5;
      const delta = scorer.calculateLineClearScore(4, 'none', false);
      expect(delta).toBe(4000);
    });
  });

  // ─── T-spin scoring (level 1, no B2B) ──────────────────────────────────────

  describe('T-spin scoring — level 1, no B2B', () => {
    it('T-spin 0 lines → 400', () => {
      const delta = scorer.calculateLineClearScore(0, 'full', false);
      expect(delta).toBe(400);
    });

    it('T-spin mini 0 lines → 100', () => {
      const delta = scorer.calculateLineClearScore(0, 'mini', false);
      expect(delta).toBe(100);
    });

    it('T-spin single → 800', () => {
      const delta = scorer.calculateLineClearScore(1, 'full', false);
      expect(delta).toBe(800);
    });

    it('T-spin mini single → 200', () => {
      const delta = scorer.calculateLineClearScore(1, 'mini', false);
      expect(delta).toBe(200);
    });

    it('T-spin double → 1200', () => {
      const delta = scorer.calculateLineClearScore(2, 'full', false);
      expect(delta).toBe(1200);
    });

    it('T-spin mini double → 400', () => {
      const delta = scorer.calculateLineClearScore(2, 'mini', false);
      expect(delta).toBe(400);
    });

    it('T-spin triple → 1600', () => {
      const delta = scorer.calculateLineClearScore(3, 'full', false);
      expect(delta).toBe(1600);
    });
  });

  // ─── Back-to-back modifier ──────────────────────────────────────────────────

  describe('back-to-back modifier', () => {
    it('B2B Tetris → floor(800 × 1.5) = 1200', () => {
      // First Tetris sets b2b active; second gets the bonus
      scorer.calculateLineClearScore(4, 'none', false); // sets b2b
      const delta = scorer.calculateLineClearScore(4, 'none', false); // gets b2b
      expect(delta).toBe(1200);
    });

    it('B2B T-spin double → floor(1200 × 1.5) = 1800', () => {
      scorer.calculateLineClearScore(4, 'none', false); // first difficult clear: set b2b
      const delta = scorer.calculateLineClearScore(2, 'full', false); // b2b T-spin double
      expect(delta).toBe(1800);
    });

    it('B2B does NOT apply to regular 1-3 line clears — single line after Tetris gets no bonus', () => {
      scorer.calculateLineClearScore(4, 'none', false); // set b2b
      const delta = scorer.calculateLineClearScore(1, 'none', false); // single — no b2b
      expect(delta).toBe(100);
    });

    it('chain state: Tetris → single → Tetris → Tetris (last gets B2B)', () => {
      scorer.calculateLineClearScore(4, 'none', false); // b2b active
      scorer.calculateLineClearScore(1, 'none', false); // breaks b2b
      scorer.calculateLineClearScore(4, 'none', false); // b2b starts again (no bonus)
      const delta = scorer.calculateLineClearScore(4, 'none', false); // b2b applies
      expect(delta).toBe(1200);
    });

    it('single after Tetris breaks B2B — next Tetris is first in new chain (no bonus)', () => {
      scorer.calculateLineClearScore(4, 'none', false); // b2b active
      scorer.calculateLineClearScore(1, 'none', false); // breaks b2b
      const delta = scorer.calculateLineClearScore(4, 'none', false); // first after break = no bonus
      expect(delta).toBe(800);
    });
  });

  // ─── Combo bonus ────────────────────────────────────────────────────────────

  describe('combo bonus', () => {
    it('1st consecutive clear (combo=1) at level 1 → +50 added to score', () => {
      scorer.calculateLineClearScore(1, 'none', false); // combo becomes 0 (first clear)
      const before = scorer.score;
      scorer.calculateLineClearScore(1, 'none', false); // combo=1 → +50
      const delta = scorer.score - before;
      // base 100 + combo bonus 50
      expect(delta).toBe(150);
    });

    it('2nd consecutive clear (combo=2) at level 2 → combo bonus = 50 × 2 × 2 = 200', () => {
      scorer.level = 2;
      scorer.calculateLineClearScore(1, 'none', false); // combo=0
      scorer.calculateLineClearScore(1, 'none', false); // combo=1 → +100
      const before = scorer.score;
      scorer.calculateLineClearScore(1, 'none', false); // combo=2, level 2 → +200
      const comboBonus = scorer.score - before - 200; // subtract base (100×2=200)
      expect(comboBonus).toBe(200);
    });

    it('combo resets to -1 when piece locks without clearing lines', () => {
      scorer.calculateLineClearScore(1, 'none', false); // combo=0
      scorer.calculateLineClearScore(1, 'none', false); // combo=1
      scorer.calculateLineClearScore(0, 'none', false); // lock without lines → combo reset
      expect(scorer.combo).toBe(-1);
    });

    it('no combo bonus on first clear (combo goes from -1 → 0)', () => {
      const delta = scorer.calculateLineClearScore(1, 'none', false);
      expect(delta).toBe(100); // no combo bonus on first clear (combo=0 doesn't trigger)
      expect(scorer.combo).toBe(0);
    });
  });

  // ─── Perfect clear bonus ────────────────────────────────────────────────────

  describe('perfect clear bonus', () => {
    it('perfect clear single (1 line) at level 1: 100 (line) + 800 (PC bonus) = 900', () => {
      const delta = scorer.calculateLineClearScore(1, 'none', true);
      expect(delta).toBe(900);
    });

    it('perfect clear Tetris (4 lines) at level 1: 800 + 2000 = 2800', () => {
      const delta = scorer.calculateLineClearScore(4, 'none', true);
      expect(delta).toBe(2800);
    });

    it('perfect clear B2B Tetris at level 1: 1200 (B2B) + 3200 (B2B PC bonus) = 4400', () => {
      scorer.calculateLineClearScore(4, 'none', false); // set b2b
      const delta = scorer.calculateLineClearScore(4, 'none', true); // B2B + perfect clear
      expect(delta).toBe(4400);
    });
  });

  // ─── Drop scores ────────────────────────────────────────────────────────────

  describe('drop scores', () => {
    it('hard drop 5 cells → +10 (2 × 5)', () => {
      scorer.addHardDropScore(5);
      expect(scorer.score).toBe(10);
    });

    it('soft drop 3 cells → +3 (1 × 3)', () => {
      scorer.addSoftDropScore(3);
      expect(scorer.score).toBe(3);
    });
  });

  // ─── Level progression ──────────────────────────────────────────────────────

  describe('level progression', () => {
    it('start at level 1, 0 lines cleared → level 1', () => {
      expect(scorer.level).toBe(1);
    });

    it('10 lines cleared → level 2', () => {
      scorer.lines = 9;
      scorer.calculateLineClearScore(1, 'none', false); // clears 1 more → 10 total
      expect(scorer.level).toBe(2);
    });

    it('19 lines cleared → level 2 (not yet 20)', () => {
      scorer.lines = 18;
      scorer.calculateLineClearScore(1, 'none', false); // 19 total
      expect(scorer.level).toBe(2);
    });

    it('20 lines cleared → level 3', () => {
      scorer.lines = 19;
      scorer.calculateLineClearScore(1, 'none', false); // 20 total
      expect(scorer.level).toBe(3);
    });

    it('200 lines cleared → level 20 (capped)', () => {
      scorer.lines = 199;
      scorer.calculateLineClearScore(1, 'none', false); // 200 total
      expect(scorer.level).toBe(20);
    });
  });

  // ─── Gravity formula ────────────────────────────────────────────────────────

  describe('getGravityMs', () => {
    it('level 1 → ~800ms/row (within ±10ms)', () => {
      const ms = Scorer.getGravityMs(1);
      expect(ms).toBeGreaterThanOrEqual(790);
      expect(ms).toBeLessThanOrEqual(810);
    });

    it('level 5 → ~217ms/row (within ±5ms)', () => {
      const ms = Scorer.getGravityMs(5);
      expect(ms).toBeGreaterThanOrEqual(212);
      expect(ms).toBeLessThanOrEqual(222);
    });

    it('level 10 → ~83ms/row (within ±3ms)', () => {
      const ms = Scorer.getGravityMs(10);
      expect(ms).toBeGreaterThanOrEqual(80);
      expect(ms).toBeLessThanOrEqual(86);
    });

    it('level 20 → < 5ms/row (effectively instant)', () => {
      const ms = Scorer.getGravityMs(20);
      expect(ms).toBeLessThan(5);
    });
  });

  // ─── Reset ──────────────────────────────────────────────────────────────────

  describe('reset', () => {
    it('reset clears all state', () => {
      scorer.calculateLineClearScore(4, 'none', false);
      scorer.addHardDropScore(10);
      scorer.reset();
      expect(scorer.score).toBe(0);
      expect(scorer.level).toBe(1);
      expect(scorer.lines).toBe(0);
      expect(scorer.combo).toBe(-1);
      expect(scorer.b2bActive).toBe(false);
    });
  });
});
