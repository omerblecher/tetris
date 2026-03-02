// src/engine/TetrisEngine.ts
import { GameState, GameEvents, PieceType, TSpinType, RotationState, CellValue } from './types';
import { Board } from './Board';
import { Bag } from './Bag';
import { Piece } from './Piece';
import { Scorer } from './Scorer';
import { LockDelay } from './LockDelay';
import { PIECE_TO_CELL } from './constants';

export class TetrisEngine {
  private board: Board;
  private bag: Bag;
  private activePiece: Piece | null = null;
  private heldPiece: PieceType | null = null;
  private holdUsed = false;
  private scorer: Scorer;
  private lockDelay: LockDelay;
  private gravityAccumulator = 0;
  private softDropping = false;
  private _isGameOver = false;
  private _isPaused = false;
  private events: Partial<GameEvents> = {};

  constructor() {
    this.board = new Board();
    this.bag = new Bag();
    this.scorer = new Scorer();
    this.lockDelay = new LockDelay();
    this.spawnPiece();
  }

  // --- Public Console API (window.game) ---

  moveLeft(): void {
    if (this._isGameOver || this._isPaused || !this.activePiece) return;
    const p = this.activePiece;
    if (this.board.isValid(p.minos, p.col - 1, p.row)) {
      p.col--;
      p.lastMoveWasRotation = false;
      this.lockDelay.onMoveOrRotate();
    }
  }

  moveRight(): void {
    if (this._isGameOver || this._isPaused || !this.activePiece) return;
    const p = this.activePiece;
    if (this.board.isValid(p.minos, p.col + 1, p.row)) {
      p.col++;
      p.lastMoveWasRotation = false;
      this.lockDelay.onMoveOrRotate();
    }
  }

  rotate(cw = true): void {
    if (this._isGameOver || this._isPaused || !this.activePiece) return;
    this.activePiece.tryRotate(cw, this.board);
    this.lockDelay.onMoveOrRotate();
  }

  hardDrop(): void {
    if (this._isGameOver || this._isPaused || !this.activePiece) return;
    const p = this.activePiece;
    const startRow = p.row;
    const ghostRow = p.ghostRow(this.board);
    const cellsDropped = ghostRow - startRow;
    p.row = ghostRow;
    this.scorer.addHardDropScore(cellsDropped);
    this.lockPiece();
  }

  softDrop(active: boolean): void {
    if (this._isGameOver || this._isPaused) return;
    this.softDropping = active;
  }

  hold(): void {
    if (this._isGameOver || this._isPaused || !this.activePiece || this.holdUsed) return;
    const currentType = this.activePiece.type;
    if (this.heldPiece === null) {
      this.heldPiece = currentType;
      this.spawnPiece();
    } else {
      const swapType = this.heldPiece;
      this.heldPiece = currentType;
      this.activePiece = new Piece(swapType);
    }
    this.holdUsed = true;
    this.events.onHold?.(this.heldPiece!, currentType);
  }

  tick(dt: number): void {
    this.update(dt);
  }

  pause(): void { this._isPaused = true; }
  resume(): void { this._isPaused = false; }

  get state(): GameState {
    const p = this.activePiece;
    return {
      board: this.board.snapshot() as CellValue[][],
      activePiece: p ? p.snapshot() : null,
      ghostPiece: p ? p.ghostSnapshot(this.board) : null,
      heldPiece: this.heldPiece,
      nextPieces: this.bag.peek(3),
      score: this.scorer.score,
      level: this.scorer.level,
      lines: this.scorer.lines,
      combo: this.scorer.combo,
      isGameOver: this._isGameOver,
      isPaused: this._isPaused,
    };
  }

  get score(): number { return this.scorer.score; }
  get level(): number { return this.scorer.level; }
  get lines(): number { return this.scorer.lines; }
  get isPaused(): boolean { return this._isPaused; }
  get isGameOver(): boolean { return this._isGameOver; }

  debug = {
    printBoard: (): void => {
      const snap = this.board.snapshot();
      const p = this.activePiece;
      const overlay = snap.map(row => [...row] as number[]);
      if (p) {
        p.minos.forEach(([dc, dr]) => {
          const r = p.row + dr;
          const c = p.col + dc;
          if (r >= 0 && r < 20 && c >= 0 && c < 10) overlay[r][c] = 8; // active piece marker
        });
      }
      console.log(overlay.map(row =>
        row.map(c => c === 0 ? '.' : c === 8 ? 'X' : String(c)).join(' ')
      ).join('\n'));
    },
    setNextPiece: (type: PieceType): void => {
      // Inject piece type at front of bag queue for testing
      (this.bag as any).queue.unshift(type);
    },
  };

  on<K extends keyof GameEvents>(event: K, handler: GameEvents[K]): void {
    this.events[event] = handler as any;
  }

  reset(): void {
    this.board.reset();
    this.bag = new Bag();
    this.scorer.reset();
    this.lockDelay.deactivate();
    this.activePiece = null;
    this.heldPiece = null;
    this.holdUsed = false;
    this.gravityAccumulator = 0;
    this.softDropping = false;
    this._isGameOver = false;
    this._isPaused = false;
    this.spawnPiece();
  }

  // --- Game Loop ---

  /** Called by the rAF loop (useGameEngine hook) every frame with delta ms */
  update(dt: number): void {
    if (this._isGameOver || this._isPaused || !this.activePiece) return;

    const p = this.activePiece;
    const baseGravity = Scorer.getGravityMs(this.scorer.level);
    const gravityMs = this.softDropping ? baseGravity / 20 : baseGravity;

    // Lock delay tick (when piece is on the floor)
    if (this.lockDelay.isActive) {
      if (this.lockDelay.tick(dt)) {
        this.lockPiece();
        return;
      }
      return; // While in lock delay, gravity accumulation pauses
    }

    // Gravity accumulation
    this.gravityAccumulator += dt;
    while (this.gravityAccumulator >= gravityMs) {
      this.gravityAccumulator -= gravityMs;
      const canMoveDown = this.board.isValid(p.minos, p.col, p.row + 1);
      if (canMoveDown) {
        const prevRow = p.row;
        p.row++;
        p.lastMoveWasRotation = false;
        if (this.softDropping) this.scorer.addSoftDropScore(1);
        if (p.row > prevRow && this.lockDelay.isActive) {
          this.lockDelay.onRowDescend();
        }
      } else {
        // Piece has landed — start lock delay
        this.gravityAccumulator = 0;
        this.lockDelay.start();
      }
    }
  }

  // --- Private Helpers ---

  private spawnPiece(): void {
    const type = this.bag.next();
    this.activePiece = new Piece(type);
    this.holdUsed = false;
    this.lockDelay.deactivate();
    this.gravityAccumulator = 0;

    // Game over: spawned piece immediately collides
    if (!this.board.isValid(this.activePiece.minos, this.activePiece.col, this.activePiece.row)) {
      this._isGameOver = true;
      this.activePiece = null;
      this.events.onGameOver?.(this.scorer.score);
    }
  }

  private lockPiece(): void {
    const p = this.activePiece;
    if (!p) return;

    // Detect T-spin before locking
    const tSpin = this.detectTSpin(p);

    // Lock piece onto board
    const cellValue = PIECE_TO_CELL[p.type];
    this.board.lock(p.minos, p.col, p.row, cellValue);
    this.lockDelay.deactivate();

    // Fire piece lock event
    this.events.onPieceLock?.(p.type, tSpin);

    // Clear lines and score
    const clearedRows = this.board.clearLines();
    const linesCleared = clearedRows.length;
    const isPerfectClear = linesCleared > 0 && this.board.isPerfectClear();

    const prevLevel = this.scorer.level;
    this.scorer.calculateLineClearScore(linesCleared, tSpin, isPerfectClear);
    const newLevel = this.scorer.level;

    if (linesCleared > 0) {
      this.events.onLineClear?.(linesCleared, this.scorer.score, tSpin, this.scorer.b2bActive, clearedRows);
    }
    if (newLevel > prevLevel) {
      this.events.onLevelUp?.(newLevel);
    }
    this.events.onScoreUpdate?.(this.scorer.score, this.scorer.level, this.scorer.lines);

    this.activePiece = null;
    this.spawnPiece();
  }

  /**
   * T-spin detection: 3-corner rule with front/back distinction.
   * Source: tetris.wiki/T-Spin
   */
  private detectTSpin(p: InstanceType<typeof Piece>): TSpinType {
    if (p.type !== 'T' || !p.lastMoveWasRotation) return 'none';

    // Corner positions relative to T-piece center (col+1, row+1), per rotation state
    // Front = the two corners in the direction the flat side faces
    type Corners = { front: [number, number][]; back: [number, number][] };
    const CORNERS_BY_ROTATION: Record<RotationState, Corners> = {
      0: { front: [[-1,-1],[+1,-1]], back: [[-1,+1],[+1,+1]] }, // flat side up
      1: { front: [[+1,-1],[+1,+1]], back: [[-1,-1],[-1,+1]] }, // flat side right
      2: { front: [[-1,+1],[+1,+1]], back: [[-1,-1],[+1,-1]] }, // flat side down
      3: { front: [[-1,-1],[-1,+1]], back: [[+1,-1],[+1,+1]] }, // flat side left
    };

    const center = { col: p.col + 1, row: p.row + 1 };
    const { front, back } = CORNERS_BY_ROTATION[p.rotation];

    const isOccupied = ([dc, dr]: [number, number]): boolean => {
      const c = center.col + dc;
      const r = center.row + dr;
      // Out of bounds counts as occupied (wall/floor)
      if (c < 0 || c >= 10 || r >= 20) return true;
      if (r < 0) return false;
      return this.board.getCell(c, r) !== 0;
    };

    const frontCount = front.filter(isOccupied).length;
    const backCount = back.filter(isOccupied).length;

    if (frontCount === 2 && backCount >= 1) return 'full';
    // 5th kick (index 4) auto-promotes mini to full
    if (p.lastKickIndex === 4 && frontCount + backCount >= 3) return 'full';
    if (frontCount >= 1 && backCount === 2) return 'mini';
    return 'none';
  }
}
