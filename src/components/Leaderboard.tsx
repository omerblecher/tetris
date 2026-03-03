import { useLeaderboard } from '../hooks/useLeaderboard';
import { useAuth } from '../contexts/AuthContext';
import type { CSSProperties } from 'react';

const panelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  width: '100%',
};

const labelStyle: CSSProperties = {
  fontFamily: 'Orbitron, monospace',
  fontSize: '10px',
  letterSpacing: '2px',
  color: 'var(--color-dim)',
  marginBottom: '6px',
};

function rowStyle(isCurrentUser: boolean): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: '24px 1fr auto',
    gap: '4px',
    alignItems: 'center',
    padding: '4px 2px',
    fontFamily: 'Orbitron, monospace',
    fontSize: '10px',
    letterSpacing: '1px',
    borderRadius: '2px',
    ...(isCurrentUser
      ? {
          color: 'var(--color-accent)',
          textShadow: '0 0 8px var(--color-accent)',
          background: 'rgba(0, 240, 240, 0.06)',
        }
      : {
          color: 'var(--color-text)',
          opacity: 0.85,
        }),
  };
}

export function Leaderboard() {
  const entries = useLeaderboard();
  const { user } = useAuth();

  return (
    <div style={panelStyle}>
      <div style={labelStyle}>GLOBAL TOP 10</div>
      {entries.map((entry, i) => {
        const isCurrentUser = !!user && user.uid === entry.uid;
        return (
          <div key={entry.uid} style={rowStyle(isCurrentUser)}>
            <span style={{ color: 'var(--color-dim)', fontSize: '9px' }}>
              #{i + 1}
            </span>
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '90px',
              }}
            >
              {entry.displayName}
            </span>
            <span style={{ textAlign: 'right' }}>
              {entry.score.toLocaleString()}
            </span>
          </div>
        );
      })}
      {entries.length === 0 && (
        <div
          style={{
            color: 'var(--color-dim)',
            fontFamily: 'Orbitron, monospace',
            fontSize: '9px',
            letterSpacing: '1px',
            marginTop: '8px',
            textAlign: 'center',
          }}
        >
          No scores yet.
          <br />
          Be first!
        </div>
      )}
    </div>
  );
}
