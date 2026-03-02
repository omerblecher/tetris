import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { TetrisEngine } from './engine/TetrisEngine';

// Expose engine for console testing (Phase 1 requirement)
const engine = new TetrisEngine();
(window as any).game = engine;

// Start a minimal rAF loop for Phase 1 console testing
let lastTime = performance.now();
function loop(timestamp: number) {
  const dt = Math.min(timestamp - lastTime, 100);
  lastTime = timestamp;
  engine.update(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
