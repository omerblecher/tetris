// src/components/SidePanel.tsx
import { PieceType } from '../engine/types';
import { PIECE_COLORS } from '../engine/constants';

interface SidePanelProps {
  // Right panel props (undefined if left panel)
  score?: number;
  level?: number;
  lines?: number;
  bestScore?: number;
  nextPiece?: PieceType | null;
  // Left panel props
  heldPiece?: PieceType | null;
  // Side: 'left' | 'right' determines layout
  side: 'left' | 'right';
}

function PieceSwatch({ type }: { type: PieceType | null | undefined }) {
  if (!type) {
    return <div className="piece-swatch empty">—</div>;
  }
  const color = PIECE_COLORS[type].fill;
  return (
    <div
      className="piece-swatch"
      style={{
        background: color,
        boxShadow: `0 0 10px ${color}`,
      }}
    >
      {type}
    </div>
  );
}

export function SidePanel({ score, level, lines, bestScore, nextPiece, heldPiece, side }: SidePanelProps) {
  if (side === 'left') {
    return (
      <div className="side-panel panel-left">
        <div className="panel-section">
          <div className="panel-label">Hold</div>
          <PieceSwatch type={heldPiece} />
        </div>
      </div>
    );
  }

  // Right panel: Score, Level, Lines, Next, Best
  return (
    <div className="side-panel panel-right">
      <div className="panel-section">
        <div className="panel-label">Score</div>
        <div className="panel-value">{(score ?? 0).toLocaleString()}</div>
      </div>
      <div className="panel-section">
        <div className="panel-label">Best</div>
        <div className="panel-value small">{(bestScore ?? 0).toLocaleString()}</div>
      </div>
      <div className="panel-section">
        <div className="panel-label">Level</div>
        <div className="panel-value">{level ?? 1}</div>
      </div>
      <div className="panel-section">
        <div className="panel-label">Lines</div>
        <div className="panel-value">{lines ?? 0}</div>
      </div>
      <div className="panel-section">
        <div className="panel-label">Next</div>
        <PieceSwatch type={nextPiece} />
      </div>
    </div>
  );
}
