// src/hooks/useKeyboard.ts
import { useEffect } from 'react';
import type { RefObject } from 'react';
import { TetrisEngine } from '../engine/TetrisEngine';

const DAS_DELAY = 133;    // ms before auto-repeat starts (TETR.IO standard)
const ARR_INTERVAL = 33;  // ms between auto-repeat ticks (2 frames @ 60fps)

interface DASState {
  timer: number;
  interval: ReturnType<typeof setInterval> | null;
}

export function useKeyboard(engineRef: RefObject<TetrisEngine | null>): void {
  useEffect(() => {
    const dasStates = new Map<string, DASState>();

    function startDAS(key: string, action: () => void): void {
      if (dasStates.has(key)) return; // already held
      action(); // immediate first move
      const state: DASState = { timer: 0, interval: null };
      dasStates.set(key, state);
      state.interval = setInterval(() => {
        state.timer += ARR_INTERVAL;
        if (state.timer >= DAS_DELAY) {
          action();
        }
      }, ARR_INTERVAL);
    }

    function stopDAS(key: string): void {
      const state = dasStates.get(key);
      if (state?.interval !== null) clearInterval(state!.interval!);
      dasStates.delete(key);
    }

    function onKeyDown(e: KeyboardEvent): void {
      const engine = engineRef.current;
      if (!engine) return;

      // Prevent page scroll for game keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowLeft':
          startDAS('left', () => {
            if (!engineRef.current?.isPaused && !engineRef.current?.isGameOver)
              engineRef.current?.moveLeft();
          });
          break;
        case 'ArrowRight':
          startDAS('right', () => {
            if (!engineRef.current?.isPaused && !engineRef.current?.isGameOver)
              engineRef.current?.moveRight();
          });
          break;
        case 'ArrowUp':
          engine.rotate(true);
          break;
        case 'z':
        case 'Z':
        case 'Control':
          engine.rotate(false);
          break;
        case 'ArrowDown':
          engine.softDrop(true);
          break;
        case ' ':
          engine.hardDrop();
          break;
        case 'c':
        case 'C':
          engine.hold();
          break;
        case 'p':
        case 'P':
          engine.isPaused ? engine.resume() : engine.pause();
          break;
      }
    }

    function onKeyUp(e: KeyboardEvent): void {
      const engine = engineRef.current;
      if (!engine) return;
      if (e.key === 'ArrowLeft') stopDAS('left');
      if (e.key === 'ArrowRight') stopDAS('right');
      if (e.key === 'ArrowDown') engine.softDrop(false);
    }

    function onBlur(): void {
      // Clear all DAS intervals when window loses focus to prevent stuck keys
      dasStates.forEach(state => {
        if (state.interval !== null) clearInterval(state.interval);
      });
      dasStates.clear();
      engineRef.current?.softDrop(false);
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      dasStates.forEach(state => {
        if (state.interval !== null) clearInterval(state.interval);
      });
      dasStates.clear();
    };
  }, [engineRef]);
}
