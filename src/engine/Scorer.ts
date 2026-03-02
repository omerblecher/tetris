import { TSpinType } from './types';

const LINE_SCORES: Record<number, number> = { 0: 0, 1: 100, 2: 300, 3: 500, 4: 800 };

// T-spin scores (0 lines = piece locked with T-spin but no line clear, still scores)
const TSPIN_SCORES: Record<number, number> = { 0: 400, 1: 800, 2: 1200, 3: 1600 };
const MINI_TSPIN_SCORES: Record<number, number> = { 0: 100, 1: 200, 2: 400 };

// Perfect clear bonus scores (level-scaled, Guideline values)
const PC_SCORES: Record<number, number> = { 1: 800, 2: 1200, 3: 1800, 4: 2000 };
const PC_B2B_TETRIS_BONUS = 3200; // B2B Tetris perfect clear bonus

export class Scorer {
  score = 0;
  level = 1;
  lines = 0;
  combo = -1;         // -1 = no active combo; 0+ = combo count
  b2bActive = false;  // true after a Tetris or T-spin clear

  /**
   * Call after a piece locks and lines are cleared.
   * Returns the score delta for this action.
   */
  calculateLineClearScore(
    linesCleared: number,
    tSpin: TSpinType,
    isPerfectClear: boolean
  ): number {
    let base = 0;

    if (tSpin === 'full') {
      base = (TSPIN_SCORES[linesCleared] ?? 0) * this.level;
    } else if (tSpin === 'mini') {
      base = (MINI_TSPIN_SCORES[linesCleared] ?? 0) * this.level;
    } else {
      base = (LINE_SCORES[linesCleared] ?? 0) * this.level;
    }

    // B2B applies to difficult clears (Tetris or T-spin with lines)
    const isDifficult = linesCleared === 4 || (tSpin !== 'none' && linesCleared > 0);
    const isB2B = isDifficult && this.b2bActive;
    if (isB2B && base > 0) {
      base = Math.floor(base * 1.5);
    }

    // Update B2B state
    if (isDifficult) {
      this.b2bActive = true;
    } else if (linesCleared > 0) {
      this.b2bActive = false; // non-difficult clear breaks B2B
    }

    // Combo bonus
    if (linesCleared > 0) {
      this.combo += 1;
    } else {
      this.combo = -1;
    }
    const comboBonus = (this.combo > 0 && linesCleared > 0)
      ? 50 * this.combo * this.level
      : 0;

    // Perfect clear bonus
    let pcBonus = 0;
    if (isPerfectClear && linesCleared > 0) {
      if (isB2B && linesCleared === 4) {
        pcBonus = PC_B2B_TETRIS_BONUS * this.level;
      } else {
        pcBonus = (PC_SCORES[linesCleared] ?? 0) * this.level;
      }
    }

    const total = base + comboBonus + pcBonus;
    this.score += total;

    // Update lines and level
    this.lines += linesCleared;
    this.level = Math.min(20, Math.floor(this.lines / 10) + 1);

    return total;
  }

  /** Add hard drop score: 2 points per cell dropped */
  addHardDropScore(cellsDropped: number): void {
    this.score += cellsDropped * 2;
  }

  /** Add soft drop score: 1 point per cell dropped */
  addSoftDropScore(cellsDropped: number): void {
    this.score += cellsDropped;
  }

  /**
   * Returns gravity interval in milliseconds for the given level.
   * Tetris Guideline Marathon formula, capped at level 20.
   */
  static getGravityMs(level: number): number {
    const l = Math.min(level, 20);
    return Math.pow(0.8 - (l - 1) * 0.007, l - 1) * 1000;
  }

  reset(): void {
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = -1;
    this.b2bActive = false;
  }
}
