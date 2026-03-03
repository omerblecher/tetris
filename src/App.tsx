// src/App.tsx
import { useRef } from 'react';
import { GameBoard } from './components/GameBoard';
import { SidePanel } from './components/SidePanel';
import { VirtualControls } from './components/VirtualControls';
import { AuthHeader } from './components/AuthHeader';
import { Leaderboard } from './components/Leaderboard';
import { AuthProvider } from './contexts/AuthContext';
import { useGameEngine } from './hooks/useGameEngine';

// Inner component — rendered inside AuthProvider so useGameEngine can call useAuth()
function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { engineRef, displayState, restart, togglePause } = useGameEngine(canvasRef);
  const { score, level, lines, isGameOver, nextPieces, heldPiece, bestScore, isNewPersonalBest } = displayState;

  return (
    <>
      <AuthHeader />
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
            isNewPersonalBest={isNewPersonalBest}
            onRestart={restart}
            onTogglePause={togglePause}
          />
        </div>

        {/* Right panel: Score, Level, Lines, Next, Best + Global Leaderboard */}
        <div className="panel-right">
          <SidePanel
            side="right"
            score={score}
            level={level}
            lines={lines}
            bestScore={bestScore}
            nextPiece={nextPieces[0] ?? null}
          />
          <div style={{ borderTop: '1px solid rgba(0,240,240,0.1)', marginTop: '12px', paddingTop: '12px' }}>
            <Leaderboard />
          </div>
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

export default function App() {
  return (
    <AuthProvider>
      <GameApp />
    </AuthProvider>
  );
}
