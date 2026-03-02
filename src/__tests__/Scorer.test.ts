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
      scorer.lines = 20; // keep level stable at 3 (20 lines = level 3)
      const delta = scorer.calculateLineClearScore(1, 'none', false);
      expect(delta).toBe(300);
    });

    it('4 lines at level 5 → 4000 (800 × 5)', () => {
      scorer.level = 5;
      scorer.lines = 40; // keep level stable at 5
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
    it('B2B Tetris → floor(800 × 1.5) = 1200 base (before combo)', () => {
      // Manually set b2b active to test the modifier in isolation
      scorer.b2bActive = true;
      scorer.combo = -1; // no active combo
      const delta = scorer.calculateLineClearScore(4, 'none', false);
      // delta = 1200 (b2b) + 0 (combo=0, first clear goes to combo=0 so no bonus) = 1200
      expect(delta).toBe(1200);
    });

    it('B2B T-spin double → floor(1200 × 1.5) = 1800 base', () => {
      scorer.b2bActive = true;
      scorer.combo = -1;
      const delta = scorer.calculateLineClearScore(2, 'full', false);
      expect(delta).toBe(1800);
    });

    it('B2B does NOT apply to regular 1-3 line clears — single line with b2b active gets no bonus', () => {
      scorer.b2bActive = true;
      scorer.combo = -1;
      const delta = scorer.calculateLineClearScore(1, 'none', false);
      expect(delta).toBe(100); // no b2b bonus
    });

    it('Tetris sets b2bActive to true', () => {
      scorer.calculateLineClearScore(4, 'none', false);
      expect(scorer.b2bActive).toBe(true);
    });

    it('T-spin clear sets b2bActive to true', () => {
      scorer.calculateLineClearScore(2, 'full', false);
      expect(scorer.b2bActive).toBe(true);
    });

    it('single line clear after Tetris breaks b2b — b2bActive becomes false', () => {
      scorer.calculateLineClearScore(4, 'none', false); // sets b2b
      scorer.calculateLineClearScore(1, 'none', false); // breaks b2b
      expect(scorer.b2bActive).toBe(false);
    });

    it('chain state: Tetris → single (breaks b2b) → Tetris (no bonus) → Tetris (b2b applies)', () => {
      scorer.calculateLineClearScore(4, 'none', false); // b2b active
      scorer.calculateLineClearScore(1, 'none', false); // breaks b2b
      scorer.calculateLineClearScore(4, 'none', false); // b2b starts again (no bonus, just sets b2b)
      expect(scorer.b2bActive).toBe(true);
      // Now b2b is active again — next Tetris should get B2B bonus
      scorer.b2bActive = true;
      scorer.combo = -1; // reset combo for isolation
      const delta = scorer.calculateLineClearScore(4, 'none', false); // b2b applies
      expect(delta).toBe(1200);
    });
  });

  // ─── Combo bonus ────────────────────────────────────────────────────────────

  describe('combo bonus', () => {
    it('no combo bonus on first clear (combo goes from -1 → 0)', () => {
      const delta = scorer.calculateLineClearScore(1, 'none', false);
      expect(delta).toBe(100); // no combo bonus on first clear (combo=0 doesn't trigger)
      expect(scorer.combo).toBe(0);
    });

    it('2nd consecutive clear adds combo bonus (combo=1) → +50 at level 1', () => {
      scorer.calculateLineClearScore(1, 'none', false); // combo → 0
      const before = scorer.score;
      const delta = scorer.calculateLineClearScore(1, 'none', false); // combo → 1 → +50
      expect(delta).toBe(150); // 100 (base) + 50 (combo=1 × level=1 × 50)
      expect(scorer.score - before).toBe(150);
    });

    it('combo=2 at level 1 → +100 combo bonus', () => {
      scorer.calculateLineClearScore(1, 'none', false); // combo=0
      scorer.calculateLineClearScore(1, 'none', false); // combo=1
      const before = scorer.score;
      const delta = scorer.calculateLineClearScore(1, 'none', false); // combo=2 → +100
      expect(delta).toBe(200); // 100 (base) + 100 (50 × 2 × 1)
      expect(scorer.score - before).toBe(200);
    });

    it('combo bonus scales with level: combo=2 at level 3 → 50×2×3 = 300 combo bonus', () => {
      scorer.level = 3;
      scorer.lines = 20; // keep level stable at 3
      scorer.calculateLineClearScore(1, 'none', false); // combo=0
      scorer.calculateLineClearScore(1, 'none', false); // combo=1
      const before = scorer.score;
      const delta = scorer.calculateLineClearScore(1, 'none', false); // combo=2
      expect(delta).toBe(600); // 300 (base 100×3) + 300 (50×2×3)
      expect(scorer.score - before).toBe(600);
    });

    it('combo resets to -1 when piece locks without clearing lines', () => {
      scorer.calculateLineClearScore(1, 'none', false); // combo=0
      scorer.calculateLineClearScore(1, 'none', false); // combo=1
      scorer.calculateLineClearScore(0, 'none', false); // lock without lines → combo reset
      expect(scorer.combo).toBe(-1);
    });

    it('combo counter increments correctly across consecutive clears', () => {
      expect(scorer.combo).toBe(-1);
      scorer.calculateLineClearScore(1, 'none', false);
      expect(scorer.combo).toBe(0);
      scorer.calculateLineClearScore(1, 'none', false);
      expect(scorer.combo).toBe(1);
      scorer.calculateLineClearScore(1, 'none', false);
      expect(scorer.combo).toBe(2);
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

    it('perfect clear B2B Tetris at level 1: b2b base 1200 + PC B2B bonus 3200 = 4400', () => {
      scorer.b2bActive = true;
      scorer.combo = -1; // no combo, test b2b + PC in isolation
      const delta = scorer.calculateLineClearScore(4, 'none', true);
      expect(delta).toBe(4400); // floor(800×1.5)=1200 + 3200 (b2b PC bonus)
    });

    it('perfect clear double (2 lines) at level 1: 300 + 1200 = 1500', () => {
      const delta = scorer.calculateLineClearScore(2, 'none', true);
      expect(delta).toBe(1500);
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

    it('hard drop does not affect combo or level', () => {
      scorer.addHardDropScore(10);
      expect(scorer.combo).toBe(-1);
      expect(scorer.level).toBe(1);
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
    it('level 1 → 1000ms (Guideline formula: (0.8)^0 × 1000)', () => {
      const ms = Scorer.getGravityMs(1);
      expect(ms).toBeCloseTo(1000, 0);
    });

    it('level 2 → ~793ms (Guideline formula: (0.793)^1 × 1000)', () => {
      const ms = Scorer.getGravityMs(2);
      expect(ms).toBeGreaterThanOrEqual(790);
      expect(ms).toBeLessThanOrEqual(796);
    });

    it('level 5 → ~355ms (Guideline formula)', () => {
      const ms = Scorer.getGravityMs(5);
      expect(ms).toBeGreaterThanOrEqual(350);
      expect(ms).toBeLessThanOrEqual(360);
    });

    it('level 10 → ~64ms (Guideline formula)', () => {
      const ms = Scorer.getGravityMs(10);
      expect(ms).toBeGreaterThanOrEqual(60);
      expect(ms).toBeLessThanOrEqual(68);
    });

    it('level 20 → < 5ms (effectively instant)', () => {
      const ms = Scorer.getGravityMs(20);
      expect(ms).toBeLessThan(5);
    });

    it('level > 20 is capped at level 20 behavior', () => {
      const ms20 = Scorer.getGravityMs(20);
      const ms25 = Scorer.getGravityMs(25);
      expect(ms25).toBe(ms20);
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

  // ─── Score accumulation ─────────────────────────────────────────────────────

  describe('score accumulation', () => {
    it('total score accumulates across multiple actions', () => {
      scorer.calculateLineClearScore(1, 'none', false); // +100, combo→0
      scorer.addHardDropScore(3);                        // +6 (hard drop doesn't reset combo)
      // 2nd consecutive line clear: +300 base + 50 combo bonus (combo=1×level=1×50)
      scorer.calculateLineClearScore(2, 'none', false); // +350 (300 + 50 combo)
      expect(scorer.score).toBe(456); // 100 + 6 + 350
    });

    it('non-consecutive clears accumulate without combo bonus', () => {
      scorer.calculateLineClearScore(1, 'none', false); // +100, combo→0
      scorer.calculateLineClearScore(0, 'none', false); // lock without clear, combo→-1
      scorer.calculateLineClearScore(2, 'none', false); // +300, no combo (first clear again)
      expect(scorer.score).toBe(400); // 100 + 0 + 300
    });
  });
});
