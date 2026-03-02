// src/App.tsx
import { GameBoard } from './components/GameBoard';

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d0d1a',
    }}>
      <GameBoard />
    </div>
  );
}
