## What’s Happening

* The server handles moves at `backend/src/index.ts:460-491` (listens to `makeMove` and emits `moveMade` and `gameState`).

* The client emits moves from `frontend/src/components/Game.tsx:588-591` and listens to `moveMade` at `frontend/src/components/Game.tsx:93-103`.

* Your Render logs show `joinGame` but never show `makeMove`, which points to the server not receiving the move event or rejecting it early.

## Probable Causes

* Transport issues under proxy causing the event emit to be dropped (polling vs websocket mismatch).

* Client-side effect not firing consistently in production (the `SyncBridge` dependency trigger) even though it works locally.

* Player identity mismatch leading to silent rejection: server requires the move to come from the color assigned to `playerId` (`backend/src/index.ts:466-471`).

* Multiple instances (or restarts) without a Socket.IO adapter; less likely here since chat works and rooms are in-memory.

## Verification Steps (No Code Changes)

* Open the browser console on Render and confirm the client connects and shows `colorAssigned` and `gameState` messages.

* Try a move and watch the Network tab for `/socket.io/` activity; confirm the emit happens.

* Check server logs for `makeMove` lines; if none, the event isn’t reaching the server or is rejected before logging.

## Implementation Plan

### 1) Improve Server Diagnostics

* Add a lightweight debug log at the top of `makeMove` before validations to confirm receipt and show reasons when a move is rejected.

* Emit a `moveRejected` event with a small reason string when the server ignores a move (turn mismatch, invalid coordinates, room over).

### 2) Harden Client Emission

* In `SyncBridge` (`frontend/src/components/Game.tsx:566-594`), switch to a reliable trigger for emits (use the game’s move callback rather than `currentFen/currentMoveIndex`), and add a local `console.debug` on each emit.

* Add handlers for `connect_error` and `error` to surface transport issues.

### 3) Transport Stability Under Render

* Force websocket-only for both client and server to avoid polling path conflicts under proxies:

  * Server: set `transports: ["websocket"]` in `new Server(...)` (`backend/src/index.ts:236-242`).

  * Client: set `transports: ["websocket"]` in `io(...)` (`frontend/src/components/Game.tsx:56-60`).

* Explicitly set `path: "/socket.io"` on both sides to avoid Next route collisions.

### 4) Guard Against Identity Mismatch

* After `colorAssigned` on the client (`frontend/src/components/Game.tsx:61-64`), cache the assigned color and assert before emitting `makeMove` that `playerId` maps to that color.

* If mismatch, show a small inline warning and re-emit `joinGame` to resync.

### 5) Optional: Multi-Instance Safety

* If Render scales beyond one instance, add `@socket.io/redis-adapter` and a small Redis instance; otherwise in-memory rooms won’t broadcast across instances.

## Acceptance Criteria

* On Render, a valid move from the correct player triggers server `makeMove` logs and client receives `moveMade` and an updated `gameState`.

* Client displays a clear message if a move is rejected (`moveRejected`).

* Chat remains unaffected.

## Rollout & Testing

* Deploy with debug logs on, exercise a full game, and capture a short log snippet showing `joinGame → makeMove → moveMade`.

* If transport errors appear, apply the websocket-only settings and retest.

* If identity mismatch occurs, confirm the client-side check prevents silent failures and allows resync.

