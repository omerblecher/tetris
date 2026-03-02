// Piece identity
export type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

// Rotation states: 0=spawn, 1=CW90, 2=180, 3=CCW90
export type RotationState = 0 | 1 | 2 | 3;

// Board cell: 0=empty, 1-7=locked piece (maps to PieceType ordinal for color)
export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Piece snapshot for renderer — immutable view of a piece
export interface PieceSnapshot {
  type: PieceType;
  col: number;
  row: number;
  rotation: RotationState;
  minos: [number, number][]; // [colOffset, rowOffset] from piece origin
}

// Full game state snapshot (consumed by renderer and React display)
export interface GameState {
  board: CellValue[][];        // 20 rows × 10 cols
  activePiece: PieceSnapshot | null;
  ghostPiece: PieceSnapshot | null;
  heldPiece: PieceType | null;
  nextPieces: PieceType[];     // peek(1) in Phase 1; engine always supports peek(3)
  score: number;
  level: number;
  lines: number;
  combo: number;
  isGameOver: boolean;
  isPaused: boolean;
}

// T-spin classification
export type TSpinType = 'none' | 'mini' | 'full';

// Engine event callbacks — Phase 2 React subscribes to these
export interface GameEvents {
  onLineClear: (linesCleared: number, score: number, tSpin: TSpinType, isB2B: boolean) => void;
  onGameOver: (finalScore: number) => void;
  onLevelUp: (newLevel: number) => void;
  onPieceLock: (pieceType: PieceType, tSpin: TSpinType) => void;
  onScoreUpdate: (score: number, level: number, lines: number) => void;
  onHold: (heldType: PieceType, swappedFrom: PieceType) => void;
}
