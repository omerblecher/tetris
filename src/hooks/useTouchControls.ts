// src/hooks/useTouchControls.ts
import { useEffect } from 'react';
import type { RefObject } from 'react';
import { TetrisEngine } from '../engine/TetrisEngine';
import { COLS, CELL_SIZE } from '../engine/constants';

// Fixed thresholds — scaled to canvas display size at runtime
const BASE_SWIPE_PX = 30;  // horizontal/vertical minimum to count as swipe
const TAP_MAX_PX = 15;     // maximum total displacement to still be a tap

export function useTouchControls(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  engineRef: RefObject<TetrisEngine | null>
): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // State for current touch
    let startX = 0;
    let startY = 0;
    let lastMoveX = 0;
    let moved = false;

    function getScaleFactor(): number {
      // Canvas logical width = COLS * CELL_SIZE; CSS display width may differ
      const displayWidth = canvas!.getBoundingClientRect().width;
      const logicalWidth = COLS * CELL_SIZE;
      return displayWidth / logicalWidth;
    }

    function onTouchStart(e: TouchEvent): void {
      e.preventDefault();
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      lastMoveX = t.clientX;
      moved = false;
    }

    function onTouchMove(e: TouchEvent): void {
      e.preventDefault();
      const engine = engineRef.current;
      if (!engine || engine.isPaused || engine.isGameOver) return;

      const t = e.touches[0];
      const scale = getScaleFactor();
      const effectiveSwipe = BASE_SWIPE_PX * scale;

      const dx = t.clientX - lastMoveX;
      const dy = t.clientY - startY;

      // Horizontal swipe: move piece
      if (Math.abs(dx) >= effectiveSwipe) {
        if (dx > 0) engine.moveRight();
        else        engine.moveLeft();
        lastMoveX = t.clientX;
        moved = true;
      }

      // Swipe down: soft drop
      if (dy > effectiveSwipe && !moved) {
        engine.softDrop(true);
        moved = true;
      }

      // Swipe up: hard drop (dy is negative for upward swipe)
      if (dy < -effectiveSwipe && !moved) {
        engine.hardDrop();
        moved = true;
      }
    }

    function onTouchEnd(e: TouchEvent): void {
      e.preventDefault();
      const engine = engineRef.current;
      if (!engine) return;

      // Always cancel soft drop on touch end
      engine.softDrop(false);

      const t = e.changedTouches[0];
      const totalDx = Math.abs(t.clientX - startX);
      const totalDy = Math.abs(t.clientY - startY);
      const scale = getScaleFactor();
      const effectiveTap = TAP_MAX_PX * scale;

      // Tap: minimal movement -> rotate CW
      if (!moved && totalDx < effectiveTap && totalDy < effectiveTap) {
        if (!engine.isPaused && !engine.isGameOver) {
          engine.rotate(true); // CW per CONTEXT.md: "Tap anywhere on board = rotate clockwise"
        }
      }
    }

    // { passive: false } REQUIRED to allow e.preventDefault()
    // Modern browsers default to passive: true for scroll performance
    canvas.addEventListener('touchstart',  onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',   onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',    onTouchEnd,   { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd,   { passive: false });

    return () => {
      canvas.removeEventListener('touchstart',  onTouchStart);
      canvas.removeEventListener('touchmove',   onTouchMove);
      canvas.removeEventListener('touchend',    onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [canvasRef, engineRef]);
}
