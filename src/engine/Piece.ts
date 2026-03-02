// src/engine/Piece.ts
import { PieceType, RotationState, PieceSnapshot } from './types';
import { TETROMINOES, SPAWN_POSITIONS } from './constants';
import { getKicks } from './SRS';
import { Board } from './Board';

export class Piece {
  type: PieceType;
  col: number;
  row: number;
  rotation: RotationState;
  lastMoveWasRotation = false;
  lastKickIndex = 0;  // 0-based index of the kick test that succeeded (for T-spin mini→full promotion)

  constructor(type: PieceType) {
    this.type = type;
    const spawn = SPAWN_POSITIONS[type];
    this.col = spawn.col;
    this.row = spawn.row;
    this.rotation = 0;
  }

  get minos(): [number, number][] {
    return TETROMINOES[this.type][this.rotation];
  }

  /**
   * Attempt rotation (CW or CCW) with SRS wall kicks.
   * Returns true if rotation succeeded, false if all 5 tests failed.
   * Tracks lastMoveWasRotation and lastKickIndex for T-spin detection.
   */
  tryRotate(cw: boolean, board: Board): boolean {
    const nextRotation = cw
      ? ((this.rotation + 1) % 4) as RotationState
      : ((this.rotation + 3) % 4) as RotationState;

    const kicks = getKicks(this.type, this.rotation, nextRotation);
    const newMinos = TETROMINOES[this.type][nextRotation];

    for (let i = 0; i < kicks.length; i++) {
      const [dx, dy] = kicks[i];
      // tetris.wiki uses +y=up; board uses +row=down — invert dy
      const newCol = this.col + dx;
      const newRow = this.row - dy;

      if (board.isValid(newMinos, newCol, newRow)) {
        this.rotation = nextRotation;
        this.col = newCol;
        this.row = newRow;
        this.lastMoveWasRotation = true;
        this.lastKickIndex = i;
        return true;
      }
    }
    return false;
  }

  /**
   * Compute ghost piece position: scan down from current position until invalid.
   */
  ghostRow(board: Board): number {
    let ghostRow = this.row;
    while (board.isValid(this.minos, this.col, ghostRow + 1)) {
      ghostRow++;
    }
    return ghostRow;
  }

  snapshot(): PieceSnapshot {
    return {
      type: this.type,
      col: this.col,
      row: this.row,
      rotation: this.rotation,
      minos: [...this.minos],
    };
  }

  ghostSnapshot(board: Board): PieceSnapshot {
    const gRow = this.ghostRow(board);
    return {
      type: this.type,
      col: this.col,
      row: gRow,
      rotation: this.rotation,
      minos: [...this.minos],
    };
  }
}
