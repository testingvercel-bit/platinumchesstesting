import { Server as SocketIOServer } from "socket.io"
import type { NextRequest } from "next/server"

interface PlayerInfo {
  id: string
  name: string
  color: "white" | "black"
}

interface Room {
  players: PlayerInfo[]
}

interface MoveData {
  from: string
  to: string
  promotion?: string
}

const rooms = new Map<string, Room>()

let io: SocketIOServer | null = null

export async function GET() {
  if (!io) {
    const server = (globalThis as unknown as { __server?: unknown }).__server
    if (server) {
      io = new SocketIOServer(server as unknown as import("http").Server, {
        path: "/api/socket",
        addTrailingSlash: false,
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
      })

      io.on("connection", (socket) => {
        console.log("Client connected:", socket.id)

        socket.on("join-room", ({ roomId, player }: { roomId: string; player: PlayerInfo }) => {
          socket.join(roomId)

          if (!rooms.has(roomId)) {
            rooms.set(roomId, { players: [] })
          }

          const room = rooms.get(roomId)!
          const existingPlayer = room.players.find((p) => p.id === player.id)

          if (!existingPlayer) {
            room.players.push(player)
          }

          // Notify other players in the room
          socket.to(roomId).emit("opponent-joined", player)

          // Send current room state to the joining player
          socket.emit("room-state", room)
        })

        socket.on("move", ({ roomId, move }: { roomId: string; move: MoveData }) => {
          socket.to(roomId).emit("opponent-move", move)
        })

        socket.on("disconnect", () => {
          console.log("Client disconnected:", socket.id)
        })
      })
    }
  }

  return new Response("Socket server initialized", { status: 200 })
}
