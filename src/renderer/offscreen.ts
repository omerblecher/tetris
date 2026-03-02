// src/renderer/offscreen.ts
import { PieceType, CellValue } from '../engine/types';
import { PIECE_COLORS, CELL_TO_PIECE, CELL_SIZE } from '../engine/constants';

// Pre-rendered textures: one OffscreenCanvas per piece type
// Each canvas is CELL_SIZE×CELL_SIZE showing a single mino with glow baked in
const TEXTURES = new Map<PieceType, OffscreenCanvas>();

// Ghost outline textures: outline-only, no fill, colored border with glow (VIS-01)
const GHOST_TEXTURES = new Map<PieceType, OffscreenCanvas>();

function preRenderPiece(type: PieceType): OffscreenCanvas {
  const size = CELL_SIZE;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d')!;
  const { fill, glow } = PIECE_COLORS[type];

  // Bake shadowBlur into the offscreen texture once
  ctx.shadowBlur = 12;
  ctx.shadowColor = glow;
  ctx.fillStyle = fill;
  // 1px inset so glow doesn't get clipped at edges
  ctx.fillRect(1, 1, size - 2, size - 2);

  return canvas;
}

function preRenderGhost(type: PieceType): OffscreenCanvas {
  const size = CELL_SIZE;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d')!;
  const { glow } = PIECE_COLORS[type];

  // Outline-only ghost: colored border, no fill
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = glow;
  ctx.lineWidth = 2;
  ctx.shadowBlur = 8;
  ctx.shadowColor = glow;
  // Inset 3px so stroke doesn't clip at canvas edges
  ctx.strokeRect(3, 3, size - 6, size - 6);

  return canvas;
}

/** Initialize all 7 piece textures and ghost textures at startup */
export function initTextures(): void {
  const types: PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  types.forEach(type => {
    TEXTURES.set(type, preRenderPiece(type));
    GHOST_TEXTURES.set(type, preRenderGhost(type));
  });
}

/** Get pre-rendered texture for a piece type */
export function getTexture(type: PieceType): OffscreenCanvas {
  const tex = TEXTURES.get(type);
  if (!tex) throw new Error(`Texture not initialized for ${type} — call initTextures() first`);
  return tex;
}

/** Get pre-rendered ghost outline texture for a piece type */
export function getGhostTexture(type: PieceType): OffscreenCanvas {
  const tex = GHOST_TEXTURES.get(type);
  if (!tex) throw new Error(`Ghost texture not initialized for ${type} — call initTextures() first`);
  return tex;
}

/** Get pre-rendered texture from a CellValue (board cell) */
export function getTextureForCell(cell: CellValue): OffscreenCanvas | null {
  if (cell === 0) return null;
  const type = CELL_TO_PIECE[cell];
  return type ? getTexture(type) : null;
}
