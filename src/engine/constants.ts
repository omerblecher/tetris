import type { PieceType, CellValue } from './types';

export const COLS = 10;
export const ROWS = 20;
export const CELL_SIZE = 30; // pixels

// Mino offsets [colOffset, rowOffset] for each piece type × 4 rotation states
// Coordinate system: col increases rightward, row increases downward
// Origin is top-left of each piece's bounding box
// Verified against tetris.wiki/Super_Rotation_System piece diagrams
//
// I piece uses a 4×4 bounding box; all others use a 3×3 bounding box.
//
// I piece bounding box (4×4), row indices 0-3, col indices 0-3:
//   State 0: row 1 filled across all cols → [0,1],[1,1],[2,1],[3,1]
//   State 1: col 2 filled across all rows → [2,0],[2,1],[2,2],[2,3]
//   State 2: row 2 filled across all cols → [0,2],[1,2],[2,2],[3,2]
//   State 3: col 1 filled across all rows → [1,0],[1,1],[1,2],[1,3]
//
// O piece bounding box (4×4 per tetris.wiki, but effectively 2×2 minos at cols 1-2, rows 0-1):
//   All states: [1,0],[2,0],[1,1],[2,1]
//
// T piece bounding box (3×3):
//   State 0: top-center + full middle row → [1,0],[0,1],[1,1],[2,1]
//   State 1: left side → [1,0],[0,1],[1,1],[1,2] -- wait, that's right side (CW from state 0)
//   Actually for CW rotation (state 0→1): [1,0],[1,1],[2,1],[1,2]
//   State 2: bottom-center + full middle row → [0,1],[1,1],[2,1],[1,2]
//   State 3: left side (CCW from state 0): [1,0],[0,1],[1,1],[1,2]

export const TETROMINOES: Record<PieceType, [number, number][][]> = {
  // I piece — 4×4 bounding box
  I: [
    [[0, 1], [1, 1], [2, 1], [3, 1]], // state 0 — horizontal (row 1)
    [[2, 0], [2, 1], [2, 2], [2, 3]], // state 1 — vertical (col 2)
    [[0, 2], [1, 2], [2, 2], [3, 2]], // state 2 — horizontal (row 2)
    [[1, 0], [1, 1], [1, 2], [1, 3]], // state 3 — vertical (col 1)
  ],
  // O piece — all states identical (visually symmetric)
  O: [
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
    [[1, 0], [2, 0], [1, 1], [2, 1]],
  ],
  // T piece — 3×3 bounding box
  T: [
    [[1, 0], [0, 1], [1, 1], [2, 1]], // state 0 — T pointing up
    [[1, 0], [1, 1], [2, 1], [1, 2]], // state 1 — T pointing right (CW)
    [[0, 1], [1, 1], [2, 1], [1, 2]], // state 2 — T pointing down
    [[1, 0], [0, 1], [1, 1], [1, 2]], // state 3 — T pointing left (CCW)
  ],
  // S piece — 3×3 bounding box
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]], // state 0
    [[1, 0], [1, 1], [2, 1], [2, 2]], // state 1
    [[1, 1], [2, 1], [0, 2], [1, 2]], // state 2
    [[0, 0], [0, 1], [1, 1], [1, 2]], // state 3
  ],
  // Z piece — 3×3 bounding box
  Z: [
    [[0, 0], [1, 0], [1, 1], [2, 1]], // state 0
    [[2, 0], [1, 1], [2, 1], [1, 2]], // state 1
    [[0, 1], [1, 1], [1, 2], [2, 2]], // state 2
    [[1, 0], [0, 1], [1, 1], [0, 2]], // state 3
  ],
  // J piece — 3×3 bounding box
  J: [
    [[0, 0], [0, 1], [1, 1], [2, 1]], // state 0 — J pointing up-left
    [[1, 0], [2, 0], [1, 1], [1, 2]], // state 1 — J pointing up-right (CW)
    [[0, 1], [1, 1], [2, 1], [2, 2]], // state 2 — J pointing down-right
    [[1, 0], [1, 1], [0, 2], [1, 2]], // state 3 — J pointing down-left (CCW)
  ],
  // L piece — 3×3 bounding box
  L: [
    [[2, 0], [0, 1], [1, 1], [2, 1]], // state 0 — L pointing up-right
    [[1, 0], [1, 1], [1, 2], [2, 2]], // state 1 — L pointing down-right (CW)
    [[0, 1], [1, 1], [2, 1], [0, 2]], // state 2 — L pointing down-left
    [[0, 0], [1, 0], [1, 1], [1, 2]], // state 3 — L pointing up-left (CCW)
  ],
};

// Spawn position for each piece (col = left edge of bounding box, row = -1 so piece enters from top)
// I and O use col 3 so the piece center aligns over the middle columns (cols 3-6 for I, cols 4-5 for O center)
export const SPAWN_POSITIONS: Record<PieceType, { col: number; row: number }> = {
  I: { col: 3, row: -1 }, // 4×4 box, col 3 puts piece at cols 3-6 (center of 10-wide board)
  O: { col: 3, row: -1 }, // 4×4 box, minos at cols 4-5 (centered)
  T: { col: 3, row: -1 }, // 3×3 box, minos at cols 3-5 (centered)
  S: { col: 3, row: -1 }, // 3×3 box
  Z: { col: 3, row: -1 }, // 3×3 box
  J: { col: 3, row: -1 }, // 3×3 box
  L: { col: 3, row: -1 }, // 3×3 box
};

// Neon colors per piece type (synthwave palette — VIS-01)
export const PIECE_COLORS: Record<PieceType, { fill: string; glow: string }> = {
  I: { fill: '#00f5ff', glow: '#00f5ff' }, // electric cyan
  J: { fill: '#4d4dff', glow: '#6666ff' }, // electric blue
  L: { fill: '#ff8c00', glow: '#ffaa00' }, // neon orange
  O: { fill: '#ffe600', glow: '#fff44f' }, // neon yellow
  S: { fill: '#00ff7f', glow: '#00ff9f' }, // neon green
  T: { fill: '#bf00ff', glow: '#d400ff' }, // neon purple
  Z: { fill: '#ff2060', glow: '#ff4080' }, // hot pink
};

// CellValue → PieceType mapping (CellValue 1–7 maps to piece types)
export const CELL_TO_PIECE: Record<number, PieceType> = {
  1: 'I', 2: 'J', 3: 'L', 4: 'O', 5: 'S', 6: 'T', 7: 'Z',
};

// PieceType → CellValue mapping (for locking pieces onto board)
export const PIECE_TO_CELL: Record<PieceType, CellValue> = {
  I: 1, J: 2, L: 3, O: 4, S: 5, T: 6, Z: 7,
};
