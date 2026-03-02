// src/App.tsx
import { useRef } from 'react';
import { GameBoard } from './components/GameBoard';
import { SidePanel } from './components/SidePanel';
import { VirtualControls } from './components/VirtualControls';
import { useGameEngine } from './hooks/useGameEngine';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { engineRef, displayState, restart, togglePause } = useGameEngine(canvasRef);
  const { score, level, lines, isGameOver, nextPieces, heldPiece, bestScore } = displayState;

  return (
    <>
      <div className="game-layout">
        {/* Left panel: Hold piece */}
        <div className="panel-left">
          <SidePanel side="left" heldPiece={heldPiece} />
        </div>

        {/* Center: Game board canvas */}
        <div className="panel-board">
          <GameBoard
            canvasRef={canvasRef}
            engineRef={engineRef}
            isGameOver={isGameOver}
            isPaused={displayState.isPaused}
            score={score}
            bestScore={bestScore}
            onRestart={restart}
            onTogglePause={togglePause}
          />
        </div>

        {/* Right panel: Score, Level, Lines, Next, Best */}
        <div className="panel-right">
          <SidePanel
            side="right"
            score={score}
            level={level}
            lines={lines}
            bestScore={bestScore}
            nextPiece={nextPieces[0] ?? null}
          />
        </div>
      </div>

      {/* Virtual controls — sticky bottom on mobile, hidden on desktop via CSS */}
      <VirtualControls
        engineRef={engineRef}
        onTogglePause={togglePause}
      />
    </>
  );
}
