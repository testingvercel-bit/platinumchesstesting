"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Crown, Users, Zap } from "lucide-react"
import type { PlayerInfo } from "@/app/page"

interface GameLobbyProps {
  onJoinGame: (roomId: string, player: PlayerInfo) => void
}

export function GameLobby({ onJoinGame }: GameLobbyProps) {
  const [playerName, setPlayerName] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase()
  const generatePlayerId = () => Math.random().toString(36).substring(2, 12)

  const handleCreateRoom = () => {
    if (!playerName.trim()) return
    const newRoomId = generateRoomId()
    onJoinGame(newRoomId, {
      id: generatePlayerId(),
      name: playerName,
      color: "white",
    })
  }

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomCode.trim()) return
    onJoinGame(roomCode.toUpperCase(), {
      id: generatePlayerId(),
      name: playerName,
      color: "black",
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Crown className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Chess</h1>
          </div>
          <p className="text-muted-foreground">Real-time multiplayer chess</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Enter Your Name</CardTitle>
            <CardDescription>Choose a display name for the game</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-input text-foreground"
            />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Zap className="h-5 w-5 text-primary" />
                Create New Game
              </CardTitle>
              <CardDescription>Start a new room and invite a friend</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCreateRoom}
                disabled={!playerName.trim()}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create Room
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Users className="h-5 w-5 text-accent" />
                Join Existing Game
              </CardTitle>
              <CardDescription>Enter a room code to join</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Room code (e.g., ABC123)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="bg-input text-foreground uppercase"
                maxLength={6}
              />
              <Button
                onClick={handleJoinRoom}
                disabled={!playerName.trim() || !roomCode.trim()}
                variant="secondary"
                className="w-full"
              >
                Join Room
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
