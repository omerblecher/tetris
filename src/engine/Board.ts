import type { CellValue } from './types';
import { COLS, ROWS } from './constants';

export class Board {
  private cells: CellValue[][];

  constructor() {
    // CRITICAL: Use Array.from with factory — Array(ROWS).fill([]) shares references
    this.cells = Array.from({ length: ROWS }, () => Array(COLS).fill(0) as CellValue[]);
  }

  isValid(minos: [number, number][], col: number, row: number): boolean {
    return minos.every(([dc, dr]) => {
      const c = col + dc;
      const r = row + dr;
      if (c < 0 || c >= COLS) return false;  // wall check
      if (r >= ROWS) return false;             // floor check
      if (r < 0) return true;                  // spawn buffer (above board) is always valid
      return this.cells[r][c] === 0;           // occupied cell check
    });
  }

  lock(minos: [number, number][], col: number, row: number, cellValue: CellValue): void {
    minos.forEach(([dc, dr]) => {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        this.cells[r][c] = cellValue;
      }
    });
  }

  clearLines(): number {
    const fullRows = this.cells.filter(row => row.every(c => c !== 0));
    const remaining = this.cells.filter(row => row.some(c => c === 0));
    const cleared = fullRows.length;
    if (cleared > 0) {
      const emptyRows = Array.from({ length: cleared }, () => Array(COLS).fill(0) as CellValue[]);
      this.cells = [...emptyRows, ...remaining];
    }
    return cleared;
  }

  isPerfectClear(): boolean {
    return this.cells.every(row => row.every(c => c === 0));
  }

  getCell(col: number, row: number): CellValue {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return 0;
    return this.cells[row][col];
  }

  snapshot(): CellValue[][] {
    return this.cells.map(row => [...row]);
  }

  reset(): void {
    this.cells = Array.from({ length: ROWS }, () => Array(COLS).fill(0) as CellValue[]);
  }
}
