"use client"

import { useState } from "react"
import { GameLobby } from "@/components/game-lobby"
import { ChessGame } from "@/components/chess-game"

export type GameState = "lobby" | "waiting" | "playing"

export interface PlayerInfo {
  id: string
  name: string
  color: "white" | "black"
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("lobby")
  const [roomId, setRoomId] = useState<string | null>(null)
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null)

  const handleJoinGame = (room: string, player: PlayerInfo) => {
    setRoomId(room)
    setPlayerInfo(player)
    setGameState("playing")
  }

  const handleLeaveGame = () => {
    setGameState("lobby")
    setRoomId(null)
    setPlayerInfo(null)
  }

  return (
    <main className="min-h-screen bg-background">
      {gameState === "lobby" ? (
        <GameLobby onJoinGame={handleJoinGame} />
      ) : (
        <ChessGame roomId={roomId!} playerInfo={playerInfo!} onLeaveGame={handleLeaveGame} />
      )}
    </main>
  )
}
