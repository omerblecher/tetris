// src/hooks/useGameEngine.ts
import { useRef, useState, useEffect, RefObject } from 'react';
import { User } from 'firebase/auth';
import { TetrisEngine } from '../engine/TetrisEngine';
import { CanvasRenderer } from '../renderer/CanvasRenderer';
import { PieceType } from '../engine/types';
import { useAuth } from '../contexts/AuthContext';
import { submitScoreIfBest, getPersonalBest } from '../firebase/leaderboard';

const BEST_SCORE_KEY = 'tetris_best';

function loadBestScore(): number {
  return parseInt(localStorage.getItem(BEST_SCORE_KEY) ?? '0', 10) || 0;
}

function saveBestScore(score: number): number {
  const current = loadBestScore();
  if (score > current) {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
    return score;
  }
  return current;
}

interface DisplayState {
  score: number;
  level: number;
  lines: number;
  isGameOver: boolean;
  nextPieces: PieceType[];
  heldPiece: PieceType | null;
  bestScore: number;
  isPaused: boolean;
  isNewPersonalBest: boolean;
}

export function useGameEngine(canvasRef: RefObject<HTMLCanvasElement | null>) {
  // Game state lives in refs — NEVER in React state
  const engineRef = useRef<TetrisEngine | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  // Auth — user from context, kept in ref to avoid stale closure in rAF-adjacent callbacks
  const { user } = useAuth();
  const userRef = useRef<User | null>(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // Only display values go into React state (updated via engine callbacks)
  const [displayState, setDisplayState] = useState<DisplayState>({
    score: 0,
    level: 1,
    lines: 0,
    isGameOver: false,
    nextPieces: [],
    heldPiece: null,
    bestScore: loadBestScore(),
    isPaused: false,
    isNewPersonalBest: false,
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

    // Track locked mino positions for lock flash animation
    let lastLockedCells: [number, number][] = [];

    // React state updated ONLY via engine callbacks — not in the rAF loop
    engine.on('onPieceLock', (_pieceType, _tSpin) => {
      // Capture locked mino positions from engine state BEFORE next piece spawns
      // onPieceLock fires in lockPiece() before this.activePiece is set to null
      const state = engineRef.current?.state;
      if (state?.activePiece) {
        lastLockedCells = state.activePiece.minos.map(([dc, dr]) => [
          state.activePiece!.col + dc,
          state.activePiece!.row + dr,
        ] as [number, number]);
      }
      rendererRef.current?.triggerLockFlash(lastLockedCells);
      setDisplayState(prev => ({ ...prev, nextPieces: engineRef.current?.state.nextPieces ?? [] }));
    });
    engine.on('onLineClear', (_linesCleared, _score, _tSpin, _b2b, clearedRows) => {
      rendererRef.current?.triggerLineClear(clearedRows);
      setDisplayState(prev => ({
        ...prev,
        score: _score,
        level: engineRef.current?.level ?? 1,
        lines: engineRef.current?.lines ?? 0,
      }));
    });
    engine.on('onLevelUp', (_level) => {
      rendererRef.current?.triggerLevelUp();
      setDisplayState(prev => ({ ...prev, level: _level }));
    });
    engine.on('onScoreUpdate', (score, level, lines) => {
      setDisplayState(prev => ({
        ...prev,
        score,
        level,
        lines,
        isPaused: engineRef.current?.isPaused ?? false,
      }));
    });
    engine.on('onHold', (heldType, _swappedFrom) => {
      setDisplayState(prev => ({ ...prev, heldPiece: heldType }));
    });
    engine.on('onGameOver', (finalScore) => {
      const best = saveBestScore(finalScore);
      // Async score submission — IIFE so we don't block the sync callback
      (async () => {
        let isNewPB = false;
        if (userRef.current && finalScore > 0) {
          isNewPB = await submitScoreIfBest(userRef.current, finalScore);
        }
        setDisplayState(prev => ({
          ...prev,
          score: finalScore,
          isGameOver: true,
          bestScore: best,
          isNewPersonalBest: isNewPB,
        }));
      })();
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

  // Sync Firestore personal best when user signs in
  // Prevents "New personal best!" misfiring on devices with empty localStorage
  useEffect(() => {
    if (!user) return;
    getPersonalBest(user.uid).then((firestorePB) => {
      setDisplayState(prev => ({
        ...prev,
        bestScore: Math.max(prev.bestScore, firestorePB),
      }));
    });
  }, [user]);

  const restart = () => {
    engineRef.current?.reset();
    setDisplayState({
      score: 0,
      level: 1,
      lines: 0,
      isGameOver: false,
      nextPieces: engineRef.current?.state.nextPieces ?? [],
      heldPiece: null,
      bestScore: loadBestScore(),
      isPaused: false,
      isNewPersonalBest: false,
    });
  };

  const togglePause = () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.isPaused ? engine.resume() : engine.pause();
    setDisplayState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  return { engineRef, rendererRef, displayState, restart, togglePause };
}
