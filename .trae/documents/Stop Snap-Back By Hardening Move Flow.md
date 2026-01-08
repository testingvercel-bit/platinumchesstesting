## Diagnosis
- Your logs show only `makeMove:received` and no `makeMove` (success) log, so the server isn’t applying the move. The client then fires its revert timer and returns the piece.
- Common causes:
  - Server rejects the move (e.g., not joined / wrong room / not in room / not your turn / illegal move) but the rejection message is missed or processed before success.
  - Race: client emits before the server finishes `joinGame` (`socket.join(roomId)` and `socket.data` set), failing the membership checks.
  - Room membership check `socket.rooms.has(roomId)` can fail transiently on reconnection.

## Changes — Server
1. Add explicit rejection logging:
   - Log a line for each early return: not joined, wrong room, not in room, game over, not your turn, illegal move.
2. Relax room membership validation:
   - Accept moves if `socket.data.roomId === roomId` even when `socket.rooms.has(roomId)` briefly fails (reconnect window). Keep a stricter path behind a feature flag.
3. Emit a safety `gameState` after `moveMade`:
   - Continue sending `moveMade` but also emit a fresh `gameState` to resync clients that miss the event.

## Changes — Client
1. Add a readiness gate:
   - Track `joinedReady` that flips to true only after receiving the first `gameState` and `colorAssigned`.
   - In `SyncBridge`, emit only when `joinedReady` and `color === turn`.
2. Increase revert timeout and request resync:
   - Bump revert timer (e.g., 1200ms) and on revert, request `gameState` via a new `requestState` event.
3. Strengthen handlers:
   - On `moveRejected`, show the specific reason and don’t re-emit.
   - Keep the pending-move guard to dedupe emits.

## Verification
- Two browsers, start a match and make `e2→e4`:
  - Server logs show either a success (`makeMove` with SAN) or a clear rejection reason.
  - Client receives `moveMade` and does not snap back; clocks advance.
- Disconnect/reconnect test: ensure a move right after reconnect is accepted and broadcast, or safely rejected with a visible reason without snap-back.

## Expected Outcome
- Moves no longer revert; if rejected, you see a clear reason.
- Short reconnection windows don’t cause false rejections.
- Clients remain in sync even if an event is missed.