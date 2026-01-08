## Diagnosis
- Client emits the same move multiple times almost instantly (logs show repeated `makeMove:received`), causing the server to accept the first, then reject following duplicates with `not your turn`. The client handles the early rejection before the success arrives, so the piece snaps back.
- Root causes:
  - `SyncBridge` triggers on local history changes without a send guard; retries fire before `moveMade` is processed.
  - Revert timer may re-run the effect and re-emit while the server hasn’t responded.

## Fix — Client (preferred)
1. Add send guard in `SyncBridge`:
   - Track a `pendingMoveKeyRef` (e.g., `${from}-${to}-${promotion||""}`) and a `pendingRef` boolean.
   - Only emit `makeMove` if there’s no pending move.
   - Clear pending on `moveMade` or `moveRejected`, or by a timeout (e.g., 2s) if the server response is lost.
2. Align revert logic with the guard:
   - Keep the 750ms revert if the server FEN hasn’t advanced.
   - Ensure revert also clears the `pendingRef` to unblock the next attempt.
3. Strengthen event handling:
   - On `moveRejected`, clear `pendingRef` and do not re-emit; just restore board to `lastServerFenRef`.
   - On `moveMade`, update `lastServerFenRef`, clear `pendingRef`, and proceed.

## Fix — Server (optional hardening)
1. Deduplicate rapid repeats:
   - Keep `room.lastMoveByColor` with key and timestamp; ignore identical payload repeats within 300ms.
2. Add explicit logging for rejection reasons to aid troubleshooting.

## Code Touch Points
- Client: `frontend/src/components/Game.tsx`
  - `SyncBridge` send guard and pending key
  - Clear on `socket.on("moveMade")` and `socket.on("moveRejected")`
  - Keep existing overlay for turn enforcement
- Server: `backend/src/index.ts`
  - Optional duplicate suppression near `socket.on("makeMove")`
  - Extra debug logging

## Verification
- Two browsers, start a game, make `e2→e4`:
  - Observe single `makeMove:received` followed by `makeMove` log with SAN.
  - Client should not snap back; board advances and clocks update.
- Spam a drag quickly: client emits only once due to guard; no snap-back.
- Attempt move when not on turn: overlay blocks; server logs `moveRejected: not your turn`.

## Expected Outcome
- Moves emit once; server accepts; clients update reliably.
- No snap-back unless a move is truly illegal or rejected.