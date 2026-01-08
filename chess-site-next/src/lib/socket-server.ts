export interface GameRoom {
  id: string
  players: {
    white: string | null
    black: string | null
  }
  fen: string
  moves: string[]
  createdAt: Date
}

// In-memory store for game rooms (in production, use Redis or a database)
export const gameRooms = new Map<string, GameRoom>()

export function createRoom(roomId: string): GameRoom {
  const room: GameRoom = {
    id: roomId,
    players: {
      white: null,
      black: null,
    },
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: [],
    createdAt: new Date(),
  }
  gameRooms.set(roomId, room)
  return room
}

export function getRoom(roomId: string): GameRoom | undefined {
  return gameRooms.get(roomId)
}

export function joinRoom(roomId: string, playerId: string, color: "white" | "black"): boolean {
  const room = gameRooms.get(roomId)
  if (!room) return false

  if (room.players[color] === null) {
    room.players[color] = playerId
    return true
  }
  return false
}

export function updateRoomFen(roomId: string, fen: string, move: string): void {
  const room = gameRooms.get(roomId)
  if (room) {
    room.fen = fen
    room.moves.push(move)
  }
}
