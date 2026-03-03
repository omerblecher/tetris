import { useAuth } from '../contexts/AuthContext';
import type { CSSProperties } from 'react';

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '12px',
  padding: '8px 16px',
  borderBottom: '1px solid rgba(0, 240, 240, 0.15)',
  background: 'rgba(10, 10, 15, 0.6)',
  fontFamily: 'Orbitron, monospace',
  fontSize: '11px',
  letterSpacing: '1px',
  minHeight: '40px',
};

function authBtnStyle(color: string): CSSProperties {
  return {
    padding: '6px 16px',
    background: 'transparent',
    border: `1px solid ${color}`,
    color,
    fontFamily: 'Orbitron, monospace',
    fontSize: '10px',
    letterSpacing: '2px',
    cursor: 'pointer',
    borderRadius: '3px',
    whiteSpace: 'nowrap',
  };
}

export function AuthHeader() {
  const { user, loading, signIn, signOut } = useAuth();

  // Return null while loading — prevents flash of wrong state
  if (loading) return <div style={{ minHeight: '40px' }} />;

  return (
    <header style={headerStyle}>
      {user ? (
        <>
          <span style={{ color: 'var(--color-text)', opacity: 0.8 }}>
            {user.displayName}
          </span>
          <button style={authBtnStyle('var(--color-dim)')} onClick={() => signOut()}>
            SIGN OUT
          </button>
        </>
      ) : (
        <button style={authBtnStyle('var(--color-accent)')} onClick={() => signIn()}>
          SIGN IN WITH GOOGLE
        </button>
      )}
    </header>
  );
}
