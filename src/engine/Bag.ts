import { PieceType } from './types';

const ALL_TYPES: PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

export class Bag {
  private queue: PieceType[] = [];

  next(): PieceType {
    if (this.queue.length === 0) this.refill();
    return this.queue.shift()!;
  }

  peek(n: number): PieceType[] {
    // Ensure queue has at least n pieces
    while (this.queue.length < n) this.refill();
    return this.queue.slice(0, n);
  }

  reset(): void {
    this.queue = [];
  }

  private refill(): void {
    const bag = [...ALL_TYPES];
    // Fisher-Yates shuffle
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.queue.push(...bag);
  }
}
