import { Chess } from "chess.js";

const chess = new Chess();
console.log("Initial FEN:", chess.fen());

try {
  console.log("Attempting move e2-e4 with promotion null...");
  const move = chess.move({ from: "e2", to: "e4", promotion: null as any });
  console.log("Move success:", move);
} catch (e) {
  console.error("Move failed:", e);
}

try {
  console.log("Attempting invalid move e2-e5...");
  const move = chess.move({ from: "e2", to: "e5" }); // Illegal move for pawn
  console.log("Move success:", move);
} catch (e) {
  console.error("Move failed (expected):", e);
}
