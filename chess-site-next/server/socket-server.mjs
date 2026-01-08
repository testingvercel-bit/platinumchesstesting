import { Server } from "socket.io"

const io = new Server(3001, {
  path: "/socket.io",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

const rooms = new Map()

io.on("connection", (socket) => {
  console.log("[socket] client connected:", socket.id)

  socket.on("join-room", ({ roomId, player }) => {
    socket.join(roomId)

    if (!rooms.has(roomId)) {
      rooms.set(roomId, { players: [] })
    }

    const room = rooms.get(roomId)
    const existingPlayer = room.players.find((p) => p.id === player.id)
    if (!existingPlayer) {
      room.players.push(player)
    }

    socket.to(roomId).emit("opponent-joined", player)
    socket.emit("room-state", room)
  })

  socket.on("move", ({ roomId, move }) => {
    socket.to(roomId).emit("opponent-move", move)
  })

  socket.on("disconnect", () => {
    console.log("[socket] client disconnected:", socket.id)
  })
})

console.log("Socket.IO server listening on http://localhost:3001 (path /socket.io)")

