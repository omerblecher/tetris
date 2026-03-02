import type { PieceType, RotationState } from './types';

// Wall kick offsets [dx, dy] to try in order for JLSTZ pieces.
// Transition key format: "fromState->toState"
// dx = col offset (positive = right), dy = row offset.
// NOTE: tetris.wiki uses +y=up (math coords). The board uses +row=down.
// dy signs here follow tetris.wiki convention. The rotation function must invert dy
// when applying: newRow = piece.row - dy
// Source: https://tetris.wiki/Super_Rotation_System#Jl_ST_ZOffsetData
export const JLSTZ_KICKS: Record<string, [number, number][]> = {
  '0->1': [[ 0,  0], [-1,  0], [-1, +1], [ 0, -2], [-1, -2]],
  '1->0': [[ 0,  0], [+1,  0], [+1, -1], [ 0, +2], [+1, +2]],
  '1->2': [[ 0,  0], [+1,  0], [+1, -1], [ 0, +2], [+1, +2]],
  '2->1': [[ 0,  0], [-1,  0], [-1, +1], [ 0, -2], [-1, -2]],
  '2->3': [[ 0,  0], [+1,  0], [+1, +1], [ 0, -2], [+1, -2]],
  '3->2': [[ 0,  0], [-1,  0], [-1, -1], [ 0, +2], [-1, +2]],
  '3->0': [[ 0,  0], [-1,  0], [-1, -1], [ 0, +2], [-1, +2]],
  '0->3': [[ 0,  0], [+1,  0], [+1, +1], [ 0, -2], [+1, -2]],
};

// Wall kick offsets for the I piece — COMPLETELY DIFFERENT from JLSTZ.
// Using JLSTZ table for I silently breaks I-piece rotation near walls.
// Source: https://tetris.wiki/Super_Rotation_System#I_piece
export const I_KICKS: Record<string, [number, number][]> = {
  '0->1': [[ 0,  0], [-2,  0], [+1,  0], [-2, -1], [+1, +2]],
  '1->0': [[ 0,  0], [+2,  0], [-1,  0], [+2, +1], [-1, -2]],
  '1->2': [[ 0,  0], [-1,  0], [+2,  0], [-1, +2], [+2, -1]],
  '2->1': [[ 0,  0], [+1,  0], [-2,  0], [+1, -2], [-2, +1]],
  '2->3': [[ 0,  0], [+2,  0], [-1,  0], [+2, +1], [-1, -2]],
  '3->2': [[ 0,  0], [-2,  0], [+1,  0], [-2, -1], [+1, +2]],
  '3->0': [[ 0,  0], [+1,  0], [-2,  0], [+1, -2], [-2, +1]],
  '0->3': [[ 0,  0], [-1,  0], [+2,  0], [-1, +2], [+2, -1]],
};

// Sanity-check assertions (compile-time comments, not runtime):
// getKicks('I', 0, 1)  === [[0,0],[-2,0],[+1,0],[-2,-1],[+1,+2]]
// getKicks('T', 0, 1)  === [[0,0],[-1,0],[-1,+1],[0,-2],[-1,-2]]
// getKicks('O', 0, 1)  === [[0,0]]
// I and T differ — if they return the same offsets, the tables are wrong.

/**
 * Returns the 5 wall kick offsets [dx, dy] to try when rotating `pieceType`
 * from `from` rotation state to `to` rotation state.
 *
 * - O piece: returns [[0, 0]] — single no-offset test (rotation is visual only)
 * - I piece: uses I_KICKS table (distinct from JLSTZ)
 * - J, L, S, T, Z: uses JLSTZ_KICKS table
 *
 * Usage in tryRotate:
 *   for each [dx, dy] offset:
 *     newCol = piece.col + dx
 *     newRow = piece.row - dy   ← dy is inverted (wiki uses +y=up, board uses +row=down)
 *     if collision-free: accept this rotation position
 */
export function getKicks(
  pieceType: PieceType,
  from: RotationState,
  to: RotationState,
): [number, number][] {
  if (pieceType === 'O') return [[0, 0]];
  const key = `${from}->${to}`;
  if (pieceType === 'I') {
    return I_KICKS[key] ?? [[0, 0]];
  }
  return JLSTZ_KICKS[key] ?? [[0, 0]];
}
