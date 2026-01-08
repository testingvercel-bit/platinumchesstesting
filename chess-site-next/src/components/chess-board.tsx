"use client"

import type { Chess, Square, PieceSymbol } from "chess.js"
import { cn } from "@/lib/utils"

interface ChessBoardProps {
  game: Chess
  playerColor: "white" | "black"
  selectedSquare: Square | null
  validMoves: Square[]
  lastMove: { from: Square; to: Square } | null
  onSquareClick: (square: Square) => void
}

const PIECE_SYMBOLS: Record<PieceSymbol, { white: string; black: string }> = {
  k: { white: "♔", black: "♚" },
  q: { white: "♕", black: "♛" },
  r: { white: "♖", black: "♜" },
  b: { white: "♗", black: "♝" },
  n: { white: "♘", black: "♞" },
  p: { white: "♙", black: "♟" },
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"]

export function ChessBoard({
  game,
  playerColor,
  selectedSquare,
  validMoves,
  lastMove,
  onSquareClick,
}: ChessBoardProps) {
  const board = game.board()
  const displayBoard = playerColor === "black" ? [...board].reverse().map((row) => [...row].reverse()) : board
  const displayFiles = playerColor === "black" ? [...FILES].reverse() : FILES
  const displayRanks = playerColor === "black" ? [...RANKS].reverse() : RANKS

  const getSquare = (row: number, col: number): Square => {
    if (playerColor === "black") {
      return `${FILES[7 - col]}${RANKS[7 - row]}` as Square
    }
    return `${FILES[col]}${RANKS[row]}` as Square
  }

  const isLightSquare = (row: number, col: number) => (row + col) % 2 === 0

  return (
    <div className="relative">
      <div className="grid grid-cols-8 border-2 border-border rounded-lg overflow-hidden shadow-2xl">
        {displayBoard.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const square = getSquare(rowIndex, colIndex)
            const isLight = isLightSquare(rowIndex, colIndex)
            const isSelected = selectedSquare === square
            const isValidMove = validMoves.includes(square)
            const isLastMoveSquare = lastMove?.from === square || lastMove?.to === square
            const isKingInCheck = game.isCheck() && piece?.type === "k" && piece?.color === game.turn()

            return (
              <button
                key={square}
                onClick={() => onSquareClick(square)}
                className={cn(
                  "aspect-square w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center relative transition-colors",
                  isLight ? "bg-board-light" : "bg-board-dark",
                  isSelected && "bg-board-selected",
                  isLastMoveSquare && !isSelected && "bg-board-highlight/50",
                  isKingInCheck && "bg-destructive/40 ring-4 ring-destructive shadow-[0_0_14px_rgba(220,38,38,0.55)] animate-pulse",
                )}
              >
                {piece && (
                  <span
                    className={cn(
                      "text-3xl sm:text-4xl md:text-5xl lg:text-6xl select-none",
                      piece.color === "w"
                        ? "text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                        : "text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]",
                    )}
                  >
                    {PIECE_SYMBOLS[piece.type][piece.color === "w" ? "white" : "black"]}
                  </span>
                )}

                {isValidMove && (
                  <div
                    className={cn(
                      "absolute rounded-full",
                      piece ? "inset-1 border-4 border-primary/60" : "w-3 h-3 sm:w-4 sm:h-4 bg-primary/40",
                    )}
                  />
                )}

                {colIndex === 0 && (
                  <span className="absolute top-0.5 left-1 text-[10px] sm:text-xs font-medium text-muted-foreground/70">
                    {displayRanks[rowIndex]}
                  </span>
                )}
                {rowIndex === 7 && (
                  <span className="absolute bottom-0.5 right-1 text-[10px] sm:text-xs font-medium text-muted-foreground/70">
                    {displayFiles[colIndex]}
                  </span>
                )}
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}
