// src/hooks/useGameEngine.ts
import { useRef, useState, useEffect, RefObject } from 'react';
import { TetrisEngine } from '../engine/TetrisEngine';
import { CanvasRenderer } from '../renderer/CanvasRenderer';
import { PieceType } from '../engine/types';

interface DisplayState {
  score: number;
  level: number;
  lines: number;
  isGameOver: boolean;
  nextPieces: PieceType[];
}

export function useGameEngine(canvasRef: RefObject<HTMLCanvasElement | null>) {
  // Game state lives in refs — NEVER in React state
  const engineRef = useRef<TetrisEngine | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  // Only display values go into React state (updated via engine callbacks)
  const [displayState, setDisplayState] = useState<DisplayState>({
    score: 0,
    level: 1,
    lines: 0,
    isGameOver: false,
    nextPieces: [],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new TetrisEngine();
    const renderer = new CanvasRenderer(canvas);
    engineRef.current = engine;
    rendererRef.current = renderer;

    // Seed initial nextPieces (engine already has the first bag dealt)
    setDisplayState(prev => ({ ...prev, nextPieces: engine.state.nextPieces }));

    // React state updated ONLY via engine callbacks — not in the rAF loop
    engine.on('onPieceLock', (_pieceType, _tSpin) => {
      setDisplayState(prev => ({ ...prev, nextPieces: engineRef.current?.state.nextPieces ?? [] }));
    });
    engine.on('onLineClear', (_linesCleared, _score, _tSpin, _b2b, _clearedRows) => {
      // _clearedRows will be used by animation trigger in Plan 02-02
      setDisplayState(prev => ({ ...prev, score: _score, level: engineRef.current?.level ?? 1, lines: engineRef.current?.lines ?? 0 }));
    });
    engine.on('onScoreUpdate', (score, level, lines) => {
      setDisplayState(prev => ({ ...prev, score, level, lines }));
    });
    engine.on('onGameOver', (finalScore) => {
      setDisplayState(prev => ({ ...prev, score: finalScore, isGameOver: true }));
    });

    // Expose engine globally for console testing
    (window as any).game = engine;

    // rAF game loop
    let rafId: number;
    let lastTime = performance.now();

    function loop(timestamp: number) {
      // Cap dt at 100ms to handle tab-background pauses
      const dt = Math.min(timestamp - lastTime, 100);
      lastTime = timestamp;

      if (engineRef.current && rendererRef.current) {
        engineRef.current.update(dt);
        rendererRef.current.render(engineRef.current.state, dt);
      }

      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    // Cleanup: cancel loop and remove global on unmount
    return () => {
      cancelAnimationFrame(rafId);
      delete (window as any).game;
    };
  }, []); // Empty deps — engine is created once, never recreated

  const restart = () => {
    engineRef.current?.reset();
    setDisplayState({
      score: 0,
      level: 1,
      lines: 0,
      isGameOver: false,
      nextPieces: engineRef.current?.state.nextPieces ?? [],
    });
  };

  return { engineRef, displayState, restart };
}
