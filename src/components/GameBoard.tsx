// src/components/GameBoard.tsx
import { useRef, useEffect } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import { COLS, ROWS, CELL_SIZE, PIECE_COLORS } from '../engine/constants';

export function GameBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { engineRef, displayState, restart } = useGameEngine(canvasRef);
  const { score, level, lines, isGameOver, nextPieces } = displayState;

  // Keyboard controls — wired here in Phase 1 for console testing ergonomics
  // Phase 2 will expand this with auto-repeat (DAS/ARR) and mobile touch
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const engine = engineRef.current;
      if (!engine) return;

      // Prevent default scroll behavior for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowLeft':  engine.moveLeft(); break;
        case 'ArrowRight': engine.moveRight(); break;
        case 'ArrowUp':    engine.rotate(true); break;     // CW
        case 'z':
        case 'Z':          engine.rotate(false); break;    // CCW
        case 'ArrowDown':  engine.softDrop(true); break;
        case ' ':          engine.hardDrop(); break;
        case 'c':
        case 'C':          engine.hold(); break;
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      const engine = engineRef.current;
      if (!engine) return;
      if (e.key === 'ArrowDown') engine.softDrop(false);
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [engineRef]);

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

      {/* Phase 1 controls legend */}
      <div style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', fontSize: '12px', textAlign: 'center' }}>
        ← → Move | ↑ Rotate CW | Z Rotate CCW | ↓ Soft Drop | Space Hard Drop | C Hold
      </div>
    </div>
  );
}
