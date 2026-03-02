// src/components/GameBoard.tsx
import { useRef } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import { useKeyboard } from '../hooks/useKeyboard';
import { COLS, ROWS, CELL_SIZE, PIECE_COLORS } from '../engine/constants';

export function GameBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { engineRef, displayState, restart } = useGameEngine(canvasRef);
  useKeyboard(engineRef);
  const { score, level, lines, isGameOver, nextPieces } = displayState;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      {/* Next piece preview */}
      <div style={{ fontFamily: 'monospace', color: '#00f0f0', textAlign: 'center' }}>
        <div style={{ marginBottom: '8px', letterSpacing: '2px' }}>NEXT</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          {nextPieces.slice(0, 3).map((type, i) => {
            const color = PIECE_COLORS[type]?.fill ?? '#ffffff';
            return (
              <div
                key={i}
                style={{
                  width: '40px',
                  height: '20px',
                  background: color,
                  boxShadow: `0 0 8px ${color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0d0d1a',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                }}
              >
                {type}
              </div>
            );
          })}
        </div>
      </div>

      {/* Score display — React state, updated via engine events */}
      <div style={{ fontFamily: 'monospace', color: '#00f0f0', textAlign: 'center' }}>
        <div>SCORE: {score}</div>
        <div>LEVEL: {level}</div>
        <div>LINES: {lines}</div>
      </div>

      {/* Game canvas — engine renders here at 60fps */}
      <canvas
        ref={canvasRef}
        width={COLS * CELL_SIZE}
        height={ROWS * CELL_SIZE}
        style={{
          border: '1px solid rgba(0,240,240,0.3)',
          display: 'block',
        }}
      />

      {/* Game over overlay */}
      {isGameOver && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#ff4444', fontFamily: 'monospace', fontSize: '24px' }}>
            GAME OVER
          </div>
          <button
            onClick={restart}
            style={{
              marginTop: '8px',
              padding: '8px 24px',
              background: 'transparent',
              border: '1px solid #00f0f0',
              color: '#00f0f0',
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* Controls legend */}
      <div style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', fontSize: '12px', textAlign: 'center' }}>
        ← → Move | ↑ Rotate CW | Z/Ctrl Rotate CCW | ↓ Soft Drop | Space Hard Drop | C Hold | P Pause
      </div>
    </div>
  );
}
