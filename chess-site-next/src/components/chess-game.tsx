"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Chess, type Square, type Move } from "chess.js"
import { ChessBoard } from "./chess-board"
import { GameInfo } from "./game-info"
import { MoveHistory } from "./move-history"
import { useSocket } from "@/hooks/use-socket"
import type { PlayerInfo } from "@/app/page"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Copy, Check } from "lucide-react"

interface ChessGameProps {
  roomId: string
  playerInfo: PlayerInfo
  onLeaveGame: () => void
}

export function ChessGame({ roomId, playerInfo, onLeaveGame }: ChessGameProps) {
  const [game, setGame] = useState(new Chess())
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [validMoves, setValidMoves] = useState<Square[]>([])
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null)
  const [opponent, setOpponent] = useState<PlayerInfo | null>(null)
  const [gameStatus, setGameStatus] = useState<string>("Waiting for opponent...")
  const [copied, setCopied] = useState(false)

  const { sendMove, onOpponentMove, onOpponentJoin, isConnected } = useSocket(roomId, playerInfo)

  const audioCtxRef = useRef<AudioContext | null>(null)

  const playTone = useCallback((freq: number, duration: number, gain = 0.08) => {
    let ctx = audioCtxRef.current
    if (!ctx) {
      try {
        const W = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }
        ctx = new (W.AudioContext || W.webkitAudioContext!)()
        audioCtxRef.current = ctx
      } catch {
        return
      }
    }
    const osc = ctx.createOscillator()
    const volume = ctx.createGain()
    osc.type = "triangle"
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    volume.gain.setValueAtTime(gain, ctx.currentTime)
    osc.connect(volume)
    volume.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  }, [])

  const playMoveSound = useCallback((type: "move" | "capture" | "check") => {
    if (type === "capture") {
      playTone(240, 0.08, 0.09)
      playTone(180, 0.1, 0.07)
    } else if (type === "check") {
      playTone(900, 0.06, 0.08)
      playTone(700, 0.08, 0.07)
    } else {
      playTone(460, 0.06, 0.08)
    }
  }, [playTone])

  const updateGameStatus = useCallback((chess: Chess) => {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === "w" ? "Black" : "White"
      setGameStatus(`Checkmate! ${winner} wins!`)
    } else if (chess.isDraw()) {
      if (chess.isStalemate()) setGameStatus("Draw by stalemate")
      else if (chess.isThreefoldRepetition()) setGameStatus("Draw by repetition")
      else if (chess.isInsufficientMaterial()) setGameStatus("Draw by insufficient material")
      else setGameStatus("Draw by 50-move rule")
    } else if (chess.isCheck()) {
      setGameStatus(`${chess.turn() === "w" ? "White" : "Black"} is in check!`)
    } else {
      setGameStatus(`${chess.turn() === "w" ? "White" : "Black"}'s turn`)
    }
  }, [])

  useEffect(() => {
    onOpponentJoin((opponentInfo) => {
      setOpponent(opponentInfo)
      updateGameStatus(game)
    })

    onOpponentMove((move) => {
      setGame((prevGame) => {
        const newGame = new Chess(prevGame.fen())
        try {
          const targetWasOccupied = !!prevGame.get(move.to as Square)
          const result = newGame.move(move)
          setLastMove({ from: move.from as Square, to: move.to as Square })
          updateGameStatus(newGame)
          if (result) {
            const soundType = newGame.isCheck() ? "check" : targetWasOccupied ? "capture" : "move"
            playMoveSound(soundType)
          }
        } catch (e) {
          console.error("Invalid move received:", e)
        }
        return newGame
      })
    })
  }, [onOpponentJoin, onOpponentMove, game, updateGameStatus, playMoveSound])

  const handleSquareClick = (square: Square) => {
    const isMyTurn =
      (game.turn() === "w" && playerInfo.color === "white") || (game.turn() === "b" && playerInfo.color === "black")

    if (!isMyTurn || !opponent) return

    const piece = game.get(square)

    if (selectedSquare) {
      if (validMoves.includes(square)) {
        const moveResult = makeMove(selectedSquare, square)
        if (moveResult) {
          setSelectedSquare(null)
          setValidMoves([])
          return
        }
      }

      if (
        piece &&
        ((piece.color === "w" && playerInfo.color === "white") || (piece.color === "b" && playerInfo.color === "black"))
      ) {
        setSelectedSquare(square)
        const moves = game.moves({ square, verbose: true })
        setValidMoves(moves.map((m) => m.to as Square))
        return
      }

      setSelectedSquare(null)
      setValidMoves([])
      return
    }

    if (
      piece &&
      ((piece.color === "w" && playerInfo.color === "white") || (piece.color === "b" && playerInfo.color === "black"))
    ) {
      setSelectedSquare(square)
      const moves = game.moves({ square, verbose: true })
      setValidMoves(moves.map((m) => m.to as Square))
    }
  }

  const makeMove = (from: Square, to: Square): Move | null => {
    const newGame = new Chess(game.fen())
    try {
      const move = newGame.move({ from, to, promotion: "q" })
      if (move) {
        setGame(newGame)
        setLastMove({ from, to })
        sendMove({ from, to, promotion: "q" })
        updateGameStatus(newGame)
        const soundType = newGame.isCheck() ? "check" : move.flags.includes("c") ? "capture" : "move"
        playMoveSound(soundType)
        return move
      }
    } catch (e) {
      console.error("Invalid move:", e)
    }
    return null
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onLeaveGame} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Leave Game
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Room:</span>
            <code className="bg-secondary px-3 py-1 rounded text-sm font-mono text-secondary-foreground">{roomId}</code>
            <Button variant="ghost" size="icon" onClick={copyRoomCode}>
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr,320px] gap-6">
          <div className="flex flex-col items-center">
            <GameInfo
              player={
                opponent || { id: "", name: "Waiting...", color: playerInfo.color === "white" ? "black" : "white" }
              }
              isCurrentTurn={
                opponent !== null &&
                ((game.turn() === "w" && opponent?.color === "white") ||
                  (game.turn() === "b" && opponent?.color === "black"))
              }
              position="top"
            />

            <ChessBoard
              game={game}
              playerColor={playerInfo.color}
              selectedSquare={selectedSquare}
              validMoves={validMoves}
              lastMove={lastMove}
              onSquareClick={handleSquareClick}
            />

            <GameInfo
              player={playerInfo}
              isCurrentTurn={
                (game.turn() === "w" && playerInfo.color === "white") ||
                (game.turn() === "b" && playerInfo.color === "black")
              }
              position="bottom"
            />
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-primary" : "bg-destructive"}`} />
                <span className="text-sm text-muted-foreground">{isConnected ? "Connected" : "Connecting..."}</span>
              </div>
              <p className="text-foreground font-medium">{gameStatus}</p>
            </div>

            <MoveHistory game={game} />
          </div>
        </div>
      </div>
    </div>
  )
}
