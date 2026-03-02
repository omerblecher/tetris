import { describe, it, expect, beforeEach } from 'vitest';
import { Board } from '../engine/Board';
import { COLS, ROWS } from '../engine/constants';
import type { CellValue } from '../engine/types';

describe('Board', () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
  });

  // --- isValid() ---

  describe('isValid()', () => {
    it('returns true for a valid position in the center of an empty board', () => {
      // Single mino at col 5, row 10 — clearly inside the board
      expect(board.isValid([[0, 0]], 5, 10)).toBe(true);
    });

    it('returns false when a mino would go left of col 0 (left wall collision)', () => {
      // Mino at dc=0, col=-1 → absolute col -1 < 0
      expect(board.isValid([[0, 0]], -1, 5)).toBe(false);
    });

    it('returns false when a mino would go right of col 9 (right wall collision)', () => {
      // Mino at dc=0, col=10 → absolute col 10 >= COLS(10)
      expect(board.isValid([[0, 0]], 10, 5)).toBe(false);
    });

    it('returns false when a mino would go below row 19 (floor collision)', () => {
      // Mino at dr=0, row=20 → absolute row 20 >= ROWS(20)
      expect(board.isValid([[0, 0]], 5, 20)).toBe(false);
    });

    it('returns true when mino is at row -1 (spawn buffer above board)', () => {
      // Negative row is the spawn buffer — always valid
      expect(board.isValid([[0, 0]], 5, -1)).toBe(true);
    });

    it('returns false when a mino lands on an already-occupied cell', () => {
      // Lock a piece at col=3, row=5 first, then try to place there
      board.lock([[0, 0]], 3, 5, 1 as CellValue);
      expect(board.isValid([[0, 0]], 3, 5)).toBe(false);
    });

    it('returns true for multi-mino piece in valid position', () => {
      // I piece horizontal: minos [0,0],[1,0],[2,0],[3,0] at col=3, row=10
      const iMinos: [number, number][] = [[0, 0], [1, 0], [2, 0], [3, 0]];
      expect(board.isValid(iMinos, 3, 10)).toBe(true);
    });

    it('returns false for multi-mino piece where one mino hits right wall', () => {
      // I piece horizontal at col=8: mino [3,0] → col 11 > COLS
      const iMinos: [number, number][] = [[0, 0], [1, 0], [2, 0], [3, 0]];
      expect(board.isValid(iMinos, 8, 10)).toBe(false);
    });

    it('returns true at exactly the right wall boundary (col 9)', () => {
      expect(board.isValid([[0, 0]], 9, 5)).toBe(true);
    });

    it('returns true at exactly the bottom boundary (row 19)', () => {
      expect(board.isValid([[0, 0]], 5, 19)).toBe(true);
    });
  });

  // --- lock() and getCell() ---

  describe('lock() and getCell()', () => {
    it('places piece cells into board state and getCell returns the correct CellValue', () => {
      board.lock([[0, 0]], 3, 5, 1 as CellValue);
      expect(board.getCell(3, 5)).toBe(1);
    });

    it('locks multiple minos and each returns the correct CellValue', () => {
      const minos: [number, number][] = [[0, 0], [1, 0], [2, 0], [3, 0]];
      board.lock(minos, 3, 10, 4 as CellValue);
      expect(board.getCell(3, 10)).toBe(4);
      expect(board.getCell(4, 10)).toBe(4);
      expect(board.getCell(5, 10)).toBe(4);
      expect(board.getCell(6, 10)).toBe(4);
    });

    it('getCell returns 0 for empty cells', () => {
      expect(board.getCell(0, 0)).toBe(0);
      expect(board.getCell(9, 19)).toBe(0);
    });

    it('getCell returns 0 for out-of-bounds coordinates', () => {
      expect(board.getCell(-1, 0)).toBe(0);
      expect(board.getCell(0, -1)).toBe(0);
      expect(board.getCell(COLS, 0)).toBe(0);
      expect(board.getCell(0, ROWS)).toBe(0);
    });
  });

  // --- clearLines() ---

  describe('clearLines()', () => {
    it('returns empty array on an empty board', () => {
      expect(board.clearLines()).toEqual([]);
    });

    it('returns [19] and removes the row when one full row is present', () => {
      // Fill row 19 entirely
      const fullRow: [number, number][] = Array.from({ length: COLS }, (_, i) => [i, 0]);
      board.lock(fullRow, 0, 19, 1 as CellValue);

      const cleared = board.clearLines();
      expect(cleared).toEqual([19]);
      // Row 19 is now empty (rows shifted down)
      for (let c = 0; c < COLS; c++) {
        expect(board.getCell(c, 19)).toBe(0);
      }
    });

    it('returns [16,17,18,19] when four full rows are present', () => {
      // Fill rows 16-19 entirely
      for (let r = 16; r <= 19; r++) {
        const fullRow: [number, number][] = Array.from({ length: COLS }, (_, i) => [i, 0]);
        board.lock(fullRow, 0, r, 1 as CellValue);
      }
      const cleared = board.clearLines();
      expect(cleared).toEqual([16, 17, 18, 19]);
    });

    it('after clearLines, empty rows are prepended at the top', () => {
      // Put a non-full row at row 15 (with a marker), fill rows 16-19
      board.lock([[0, 0]], 0, 15, 2 as CellValue); // partial row 15
      for (let r = 16; r <= 19; r++) {
        const fullRow: [number, number][] = Array.from({ length: COLS }, (_, i) => [i, 0]);
        board.lock(fullRow, 0, r, 1 as CellValue);
      }
      board.clearLines(); // clears rows 16-19 (4 rows)
      // Row 15 (which had the marker) should have shifted down to row 19
      expect(board.getCell(0, 19)).toBe(2);
      // Rows 0-3 should be empty (4 new empty rows prepended)
      for (let c = 0; c < COLS; c++) {
        expect(board.getCell(c, 0)).toBe(0);
        expect(board.getCell(c, 1)).toBe(0);
        expect(board.getCell(c, 2)).toBe(0);
        expect(board.getCell(c, 3)).toBe(0);
      }
    });

    it('does not clear partial rows', () => {
      // Fill row 19 except for one cell
      const partialRow: [number, number][] = Array.from({ length: COLS - 1 }, (_, i) => [i, 0]);
      board.lock(partialRow, 0, 19, 1 as CellValue);
      expect(board.clearLines()).toEqual([]);
    });
  });

  // --- isPerfectClear() ---

  describe('isPerfectClear()', () => {
    it('returns true on a completely empty board', () => {
      expect(board.isPerfectClear()).toBe(true);
    });

    it('returns false on empty board with one locked cell', () => {
      board.lock([[0, 0]], 0, 19, 1 as CellValue);
      expect(board.isPerfectClear()).toBe(false);
    });

    it('returns true after clearing all rows (board fully empty)', () => {
      // Fill all rows
      for (let r = 0; r < ROWS; r++) {
        const fullRow: [number, number][] = Array.from({ length: COLS }, (_, i) => [i, 0]);
        board.lock(fullRow, 0, r, 1 as CellValue);
      }
      board.clearLines();
      expect(board.isPerfectClear()).toBe(true);
    });
  });

  // --- reset() ---

  describe('reset()', () => {
    it('empties the board — all cells return 0 after reset', () => {
      // Lock several cells
      board.lock([[0, 0], [1, 0], [2, 0]], 0, 0, 3 as CellValue);
      board.lock([[0, 0]], 9, 19, 7 as CellValue);

      board.reset();

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          expect(board.getCell(c, r)).toBe(0);
        }
      }
    });
  });

  // --- snapshot() ---

  describe('snapshot()', () => {
    it('returns a copy of the board state (not a reference)', () => {
      board.lock([[0, 0]], 3, 5, 2 as CellValue);
      const snap = board.snapshot();
      expect(snap[5][3]).toBe(2);
      // Mutating the snapshot should not affect the board
      snap[5][3] = 0;
      expect(board.getCell(3, 5)).toBe(2);
    });

    it('snapshot has correct dimensions: ROWS × COLS', () => {
      const snap = board.snapshot();
      expect(snap.length).toBe(ROWS);
      expect(snap[0].length).toBe(COLS);
    });
  });
});
