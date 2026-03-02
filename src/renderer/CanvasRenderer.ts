// src/renderer/CanvasRenderer.ts
import { GameState, PieceSnapshot } from '../engine/types';
import { CELL_SIZE, COLS, ROWS } from '../engine/constants';
import { initTextures, getTexture, getTextureForCell } from './offscreen';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    // Set canvas dimensions
    canvas.width = COLS * CELL_SIZE;
    canvas.height = ROWS * CELL_SIZE;
    // Initialize textures once
    initTextures();
  }

  render(state: GameState): void {
    const { ctx } = this;

    // Clear canvas each frame
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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

    // 3. Draw ghost piece (same color at 25% opacity)
    if (state.ghostPiece) {
      this.drawPiece(state.ghostPiece, 0.25);
    }

    // 4. Draw active piece (full opacity)
    if (state.activePiece) {
      this.drawPiece(state.activePiece, 1.0);
    }

    // 5. Game over overlay
    if (state.isGameOver) {
      this.drawGameOverOverlay();
    }
  }

  private drawGrid(): void {
    const { ctx } = this;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
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

  private drawPiece(piece: PieceSnapshot, alpha: number): void {
    const { ctx } = this;
    const texture = getTexture(piece.type);
    ctx.globalAlpha = alpha;
    piece.minos.forEach(([dc, dr]) => {
      const r = piece.row + dr;
      const c = piece.col + dc;
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        ctx.drawImage(texture, c * CELL_SIZE, r * CELL_SIZE);
      }
    });
    ctx.globalAlpha = 1.0;
  }

  private drawGameOverOverlay(): void {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#ff4444';
    ctx.font = `bold ${CELL_SIZE}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
    ctx.textAlign = 'start';
  }
}
