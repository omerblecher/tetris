// src/components/GameBoard.tsx
import { RefObject } from 'react';
import { TetrisEngine } from '../engine/TetrisEngine';
import { useKeyboard } from '../hooks/useKeyboard';

interface GameBoardProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  engineRef: RefObject<TetrisEngine | null>;
  isGameOver: boolean;
  onRestart: () => void;
  onTogglePause: () => void;
}

export function GameBoard({ canvasRef, engineRef, isGameOver, onRestart, onTogglePause: _onTogglePause }: GameBoardProps) {
  useKeyboard(engineRef);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <canvas
        id="game-canvas"
        ref={canvasRef}
      />
      {/* Game over overlay — will be replaced by full overlay in Plan 02-06 */}
      {isGameOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10,10,15,0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}>
          <div style={{ color: '#ff2060', fontFamily: 'Orbitron, monospace', fontSize: '28px', fontWeight: '900', letterSpacing: '4px' }}>
            GAME OVER
          </div>
          <button
            onClick={onRestart}
            style={{
              padding: '10px 28px',
              background: 'transparent',
              border: '2px solid var(--color-accent)',
              color: 'var(--color-accent)',
              fontFamily: 'Orbitron, monospace',
              fontSize: '14px',
              letterSpacing: '2px',
              cursor: 'pointer',
            }}
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
