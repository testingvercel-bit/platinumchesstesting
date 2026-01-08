## What’s Happening
- Both sockets join the room (backend/src/index.ts:418) but the UI shows "Opponent" because names are absent until `playerNames` arrives; if the opponent has no `userId` or `name`, the broadcast carries empty strings (backend/src/index.ts:472–475).
- The same client emits moves for both sides (`emit makeMove` frontend/src/components/Game.tsx:614). This only occurs if the local `turn` still equals the player’s `color`, meaning the client didn’t process the prior `moveMade` and `turn` update (frontend/src/components/Game.tsx:101–117). Server-side logic already rejects wrong-side moves (backend/src/index.ts:520–524), but we should hard-block piece interaction client-side.

## Changes — Server
1. Always include robust fallbacks in `playerNames` broadcast (backend/src/index.ts:452–475):
   - Prefer `room.players.<color>.name`.
   - Fallback to Supabase username if available.
   - Final fallback to a short `playerId` (e.g., first 6 chars), never empty.
2. Emit `playerNames` immediately after each successful `assignColor` and on `setName` (backend/src/index.ts:479–496) — already present; ensure fallbacks apply there too.
3. Add a `playerJoined` broadcast (already at backend/src/index.ts:477) and keep it as a trigger for client-side UI to refresh labels.

## Changes — Client
1. Make `joinGame` carry a non-empty display name early (frontend/src/components/Game.tsx:55–61):
   - If Supabase session isn’t ready, use a temporary local label (e.g., the email or `Player-<last4>`).
   - Re-emit with definitive `userId`/`meName` once session resolves (frontend/src/components/Game.tsx:152–159) — already implemented; ensure the temporary name is sent first.
2. Strengthen opponent name fallback (frontend/src/components/Game.tsx:97–100, 258–260):
   - If `playerNames` lacks a value, compute opponent label as `Opponent-<idprefix>` using `players` from initial `gameState` (backend/src/index.ts:300–314) until a real name arrives.
3. Enforce turn client-side in the board:
   - Keep `SyncBridge` emission gate (`color === turn`) (frontend/src/components/Game.tsx:607–616).
   - Disable piece drag when `color !== turn` using the board API’s move-block hook or a top-level move-attempt handler; if not available, render a transparent overlay inside the board container that captures pointer events (frontend/src/components/Game.tsx:423–425). Adjust to ensure it intercepts drag-starts within the canvas, not just clicks.
4. Make the client resilient to missed `moveMade` events:
   - If a local move is attempted but `lastServerFenRef` hasn’t advanced after a short delay, revert to server FEN and do not emit (debounce within `SyncBridge`).

## Code Touch Points
- Server
  - `joinGame` and name resolution: backend/src/index.ts:418–478
  - `playerNames` emission and fallbacks: backend/src/index.ts:452–475, 479–496
  - Turn enforcement (already correct): backend/src/index.ts:520–524
- Client
  - Initial join and re-join with `userId`: frontend/src/components/Game.tsx:55–61, 152–159
  - Name handling/UI: frontend/src/components/Game.tsx:97–100, 258–260
  - Move emission gating: frontend/src/components/Game.tsx:607–616
  - Board interaction block: frontend/src/components/Game.tsx:423–425

## Verification Plan
- Use two browsers (normal and incognito). Queue and pair; confirm both receive `colorAssigned` and `gameState` with names.
- Check sidebar labels: opponent shows a fallback label immediately, then the resolved username when available.
- Attempt to move when not on turn: client refuses to drag; server logs `moveRejected: not your turn` (backend/src/index.ts:523).
- Observe two `moveMade` events alternate between white and black and history increments correctly in the UI.
- Disconnect/reconnect either player; ensure `playerNames` re-broadcasted and the correct side retains move rights.

## Expected Outcome
- Opponent name always has a visible label, no blank "Opponent".
- Only the player whose turn it is can make a move client-side; server continues enforcing turn.
- Move history and clocks update consistently for both clients.
