## Diagnosis

* Server receives moves and emits updates in `backend/src/index.ts:503–539`:

  * Logs `makeMove:received` then emits `moveMade` with `{ from, to, san, fen }`, followed by `gameState` with full state.

* Client listens in `frontend/src/components/Game.tsx`:

  * `gameState` handler applies authoritative `fen`, `turn`, and `history` (`Game.tsx:72–95`).

  * `moveMade` handler applies `fen` and also sets `history` from `chessRef.current.history(...)` right after `load(p.fen)` (`Game.tsx:100–113`).

* Root cause: `chessRef.current.load(p.fen)` resets local move history; writing `history` from this instance can clobber the correct server history. Depending on event timing, the Moves list and replay index may be stale or empty even though the board FEN updates.

## Changes

* Update `moveMade` handler in `frontend/src/components/Game.tsx:100–113`:

  * Keep `chessRef.current.load(p.fen)` and `setFen(p.fen)`.

  * Remove `setHistory(chessRef.current.history({ verbose: true }))` and `setReplayIndex(...)` from `moveMade`.

  * Continue to update clocks, `turn`, `status`, and `lastServerFenRef.current`.

  * Rely on the subsequent `gameState` event to update `history` and `replayIndex` once per authoritative server state.

* Optional consolidation (if you prefer fewer events):

  * Include `history` in the server `moveMade` payload (`backend/src/index.ts:520–526`), and stop emitting `gameState` for move acknowledgments. Update the client `moveMade` handler to set `history` and `replayIndex` from the payload. This reduces duplicate state writes and prevents races.

* Optional hardening:

  * Wrap `chessRef.current.load(p.fen)` in a `try { ... } catch {}` to guard against malformed FENs.

  * Add temporary debug logs for `moveMade` and `gameState` receipt to confirm consistent event ordering during testing.

## Verification

* Open two clients, join the same room, make `e2 → e4`:

  * Board updates immediately for both; `fen` reflects the move.

  * Moves list increments with the SAN, and `replayIndex` matches `history.length`.

  * No flicker or overwrite from stale local history.

* Exercise reconnect: disconnect/reconnect, ensure `joinGame` re-subscribes and subsequent moves still render and list correctly.

