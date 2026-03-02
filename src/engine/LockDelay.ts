// src/engine/LockDelay.ts
export class LockDelay {
  private timer = 0;
  private resetCount = 0;
  private active = false;
  private readonly LOCK_MS = 500;
  private readonly MAX_RESETS = 15;

  /** Call when piece first touches the floor */
  start(): void {
    this.timer = this.LOCK_MS;
    this.resetCount = 0;
    this.active = true;
  }

  /** Call on any move or rotation while piece is on the floor.
   *  Returns true if the timer was reset (cap not reached). */
  onMoveOrRotate(): boolean {
    if (!this.active) return false;
    if (this.resetCount < this.MAX_RESETS) {
      this.timer = this.LOCK_MS;
      this.resetCount++;
      return true;
    }
    return false; // cap reached — piece should lock
  }

  /** Call when piece successfully moves down a row.
   *  Resets the move-reset cap (piece is on a new lower row). */
  onRowDescend(): void {
    if (this.active) {
      this.resetCount = 0;
      this.timer = this.LOCK_MS;
    }
  }

  /** Advance timer by dt ms. Returns true when piece should lock. */
  tick(dt: number): boolean {
    if (!this.active) return false;
    this.timer -= dt;
    return this.timer <= 0;
  }

  deactivate(): void {
    this.active = false;
    this.timer = 0;
    this.resetCount = 0;
  }

  get isActive(): boolean {
    return this.active;
  }
}
