// src/renderer/CanvasRenderer.ts
import { GameState, PieceSnapshot } from '../engine/types';
import { CELL_SIZE, COLS, ROWS } from '../engine/constants';
import { initTextures, getTexture, getTextureForCell, getGhostTexture } from './offscreen';

type AnimationType = 'lineClear' | 'lockFlash' | 'levelUp';

interface AnimationState {
  type: AnimationType;
  elapsed: number;
  duration: number;
  rows?: number[];             // lineClear: which rows to flash
  cells?: [number, number][];  // lockFlash: mino [col, row] positions
}

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private animations: AnimationState[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;

    // DPR scaling: canvas drawing buffer matches physical pixels
    const dpr = window.devicePixelRatio || 1;
    // Set drawing buffer to physical pixels
    canvas.width = COLS * CELL_SIZE * dpr;
    canvas.height = ROWS * CELL_SIZE * dpr;
    // CSS dimensions stay at logical pixels (canvas scales via CSS aspect-ratio)
    canvas.style.width = `${COLS * CELL_SIZE}px`;
    canvas.style.height = `${ROWS * CELL_SIZE}px`;
    // Scale all subsequent draw calls to use logical pixels
    this.ctx.scale(dpr, dpr);

    // Initialize textures once
    initTextures();
  }

  triggerLineClear(rows: number[]): void {
    this.animations.push({ type: 'lineClear', elapsed: 0, duration: 100, rows });
  }

  triggerLockFlash(cells: [number, number][]): void {
    this.animations.push({ type: 'lockFlash', elapsed: 0, duration: 50, cells });
  }

  triggerLevelUp(): void {
    this.animations.push({ type: 'levelUp', elapsed: 0, duration: 300 });
  }

  render(state: GameState, dt: number): void {
    const { ctx } = this;

    // Advance and prune animations before clearing
    this.animations = this.animations.filter(a => {
      a.elapsed += dt;
      return a.elapsed < a.duration;
    });

    // Clear canvas each frame using logical dimensions (ctx is already scaled by dpr)
    ctx.clearRect(0, 0, COLS * CELL_SIZE, ROWS * CELL_SIZE);

    // 1. Draw subtle grid (optional background grid lines)
    this.drawGrid();

    // 2. Draw locked board cells (using pre-rendered textures — no shadowBlur here)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = state.board[r][c];
        if (cell !== 0) {
          const texture = getTextureForCell(cell);
          if (texture) {
            ctx.drawImage(texture, c * CELL_SIZE, r * CELL_SIZE);
          }
        }
      }
    }

    // 3. Draw ghost piece (outline-only, using pre-baked ghost texture)
    if (state.ghostPiece) {
      this.drawPiece(state.ghostPiece, true);
    }

    // 4. Draw active piece (full opacity solid texture)
    if (state.activePiece) {
      this.drawPiece(state.activePiece, false);
    }

    // 5. Draw animation overlays (after game elements)
    for (const anim of this.animations) {
      const progress = anim.elapsed / anim.duration; // 0.0 → 1.0
      switch (anim.type) {
        case 'lineClear': this.drawLineClearFlash(anim.rows!, progress); break;
        case 'lockFlash': this.drawLockFlash(anim.cells!, progress); break;
        case 'levelUp':   this.drawLevelUpFlash(progress); break;
      }
    }
  }

  private drawGrid(): void {
    const { ctx } = this;
    // VIS-02: dark blue grid lines against near-black background
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL_SIZE, 0);
      ctx.lineTo(c * CELL_SIZE, ROWS * CELL_SIZE);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL_SIZE);
      ctx.lineTo(COLS * CELL_SIZE, r * CELL_SIZE);
      ctx.stroke();
    }
  }

  private drawPiece(piece: PieceSnapshot, isGhost: boolean): void {
    const { ctx } = this;
    // Ghost uses pre-baked outline texture (alpha already baked at 0.7); active uses solid texture
    const texture = isGhost ? getGhostTexture(piece.type) : getTexture(piece.type);
    // Always draw at full globalAlpha — ghost outline baked alpha=0.7 into the texture
    ctx.globalAlpha = 1.0;
    piece.minos.forEach(([dc, dr]) => {
      const r = piece.row + dr;
      const c = piece.col + dc;
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        ctx.drawImage(texture, c * CELL_SIZE, r * CELL_SIZE);
      }
    });
    ctx.globalAlpha = 1.0;
  }

  private drawLineClearFlash(rows: number[], progress: number): void {
    const { ctx } = this;
    const alpha = (1 - progress) * 0.85; // fade out from 0.85 to 0
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    rows.forEach(r => {
      ctx.fillRect(0, r * CELL_SIZE, COLS * CELL_SIZE, CELL_SIZE);
    });
  }

  private drawLockFlash(cells: [number, number][], progress: number): void {
    const { ctx } = this;
    const alpha = (1 - progress) * 0.7; // fade out from 0.7 to 0
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    cells.forEach(([c, r]) => {
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    });
  }

  private drawLevelUpFlash(progress: number): void {
    const { ctx } = this;
    const alpha = Math.sin(progress * Math.PI) * 0.4; // pulse in then out
    ctx.fillStyle = `rgba(255, 200, 255, ${alpha})`;
    // Use logical dimensions — ctx is already scaled by dpr
    ctx.fillRect(0, 0, COLS * CELL_SIZE, ROWS * CELL_SIZE);
  }

}
