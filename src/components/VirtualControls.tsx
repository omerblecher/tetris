// src/components/VirtualControls.tsx
import type { RefObject } from 'react';
import { TetrisEngine } from '../engine/TetrisEngine';

interface VirtualControlsProps {
  engineRef: RefObject<TetrisEngine | null>;
  onTogglePause: () => void;
}

interface VBtnProps {
  label: string;
  sublabel?: string;
  onClick: () => void;
  accentColor?: string;
}

function VBtn({ label, sublabel, onClick, accentColor = 'var(--color-accent)' }: VBtnProps) {
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault(); // prevent focus/scroll
        onClick();
      }}
      style={{
        minWidth: '60px',
        minHeight: '56px',
        background: 'transparent',
        border: `2px solid ${accentColor}`,
        borderRadius: '6px',
        color: accentColor,
        fontFamily: 'Orbitron, monospace',
        fontSize: '10px',
        fontWeight: '700',
        letterSpacing: '1px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        padding: '4px',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
    >
      <span style={{ fontSize: '18px', lineHeight: 1 }}>{label}</span>
      {sublabel && <span style={{ fontSize: '8px', opacity: 0.8 }}>{sublabel}</span>}
    </button>
  );
}

export function VirtualControls({ engineRef, onTogglePause }: VirtualControlsProps) {
  const engine = () => engineRef.current;

  return (
    <div className="virtual-controls">
      <VBtn
        label="&#8635;"
        sublabel="CCW"
        onClick={() => engine()?.rotate(false)}
        accentColor="var(--color-T)"
      />
      <VBtn
        label="&#11015;"
        sublabel="DROP"
        onClick={() => engine()?.hardDrop()}
        accentColor="var(--color-Z)"
      />
      <VBtn
        label="&#10752;"
        sublabel="HOLD"
        onClick={() => engine()?.hold()}
        accentColor="var(--color-I)"
      />
      <VBtn
        label="&#9646;&#9646;"
        sublabel="PAUSE"
        onClick={() => onTogglePause()}
        accentColor="var(--color-dim)"
      />
    </div>
  );
}
