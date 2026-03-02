// src/components/GameBoard.tsx
import type { CSSProperties, RefObject } from 'react';
import { TetrisEngine } from '../engine/TetrisEngine';
import { useKeyboard } from '../hooks/useKeyboard';
import { useTouchControls } from '../hooks/useTouchControls';

interface GameBoardProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  engineRef: RefObject<TetrisEngine | null>;
  isGameOver: boolean;
  isPaused: boolean;
  score: number;
  bestScore: number;
  onRestart: () => void;
  onTogglePause: () => void;
}

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(10, 10, 15, 0.88)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '20px',
};

function titleStyle(color: string): CSSProperties {
  return {
    color,
    fontFamily: 'Orbitron, monospace',
    fontSize: '26px',
    fontWeight: '900',
    letterSpacing: '4px',
    textShadow: `0 0 20px ${color}`,
  };
}

function btnStyle(borderColor: string): CSSProperties {
  return {
    padding: '10px 28px',
    background: 'transparent',
    border: `2px solid ${borderColor}`,
    color: borderColor,
    fontFamily: 'Orbitron, monospace',
    fontSize: '12px',
    letterSpacing: '2px',
    cursor: 'pointer',
    borderRadius: '4px',
    minWidth: '140px',
  };
}

export function GameBoard({
  canvasRef,
  engineRef,
  isGameOver,
  isPaused,
  score,
  bestScore,
  onRestart,
  onTogglePause,
}: GameBoardProps) {
  useKeyboard(engineRef);
  useTouchControls(canvasRef, engineRef);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        id="game-canvas"
        ref={canvasRef}
      />

      {/* Pause overlay */}
      {isPaused && !isGameOver && (
        <div style={overlayStyle}>
          <div style={titleStyle('#00f0f0')}>PAUSED</div>
          <button style={btnStyle('var(--color-accent)')} onClick={onTogglePause}>
            RESUME
          </button>
        </div>
      )}

      {/* Game over overlay */}
      {isGameOver && (
        <div style={overlayStyle}>
          <div style={titleStyle('#ff2060')}>GAME OVER</div>

          <div style={{ textAlign: 'center', color: 'var(--color-text)', fontSize: '13px', letterSpacing: '1px' }}>
            <div style={{ marginBottom: '4px' }}>
              SCORE <span style={{ color: 'var(--color-accent)', fontWeight: '700' }}>
                {score.toLocaleString()}
              </span>
            </div>
            <div>
              BEST <span style={{ color: '#ffe600', fontWeight: '700' }}>
                {bestScore.toLocaleString()}
              </span>
            </div>
          </div>

          <button style={btnStyle('var(--color-accent)')} onClick={onRestart}>
            PLAY AGAIN
          </button>

          {/* Phase 3 placeholder — non-functional until leaderboard exists */}
          <button
            style={{ ...btnStyle('#bf00ff'), opacity: 0.5, cursor: 'not-allowed' }}
            disabled
            title="Coming in Phase 3"
          >
            LEADERBOARD
          </button>
        </div>
      )}
    </div>
  );
}
