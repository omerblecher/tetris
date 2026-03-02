---
plan: 02-05
phase: 02-react-shell-visual-polish
completed: 2026-03-02
status: complete
requirements_satisfied:
  - CTR-02
  - CTR-03
  - LAY-04
---

# Plan 02-05 Summary: Touch Controls + Virtual Buttons

## What Was Built

### useTouchControls hook (`src/hooks/useTouchControls.ts`)
Swipe/tap gesture detection attached to the canvas element with `{ passive: false }` listeners (required for `e.preventDefault()` to prevent browser scroll).

- **Swipe threshold scaling**: `BASE_SWIPE_PX = 30` scaled by `canvas.getBoundingClientRect().width / (COLS * CELL_SIZE)` so thresholds feel consistent regardless of CSS display size
- **Swipe left/right**: moves piece; `lastMoveX` tracks incremental moves so multiple cells can be moved in a single drag
- **Swipe down**: soft drop (activates on touchmove, cancels on touchend)
- **Swipe up**: hard drop
- **Tap**: `totalDx < TAP_MAX_PX && totalDy < TAP_MAX_PX` → rotate CW; `moved` flag prevents tap from firing after a swipe

### VirtualControls component (`src/components/VirtualControls.tsx`)
Four always-visible buttons (CCW ↺, DROP ⬇, HOLD ⬚, PAUSE ⏸) using `onPointerDown` instead of `onClick` for immediate touch response (no 300ms delay). Styled with Orbitron font, neon borders matching piece colors.

### App.tsx changes
Fragment wrapper `<>` added so `VirtualControls` can be a sibling to `.game-layout`, rendered outside the grid and positioned as sticky mobile footer via CSS.

## Key Design Decisions

- **`{ passive: false }` on all touch listeners**: Without this, modern browsers default to passive (can't call `preventDefault`), which means the page would scroll/zoom during gameplay.
- **`onPointerDown` for virtual buttons**: Fires on first touch contact without the 300ms click delay that `onClick` has on mobile. `e.preventDefault()` prevents follow-up mouse events.
- **Threshold scaling via `getBoundingClientRect`**: Swipe distance should feel the same on any screen size. Scaling to CSS display width makes 30px feel like ~1/10th of the board width on all devices.

## Deviations
None. Plan executed as specified.
