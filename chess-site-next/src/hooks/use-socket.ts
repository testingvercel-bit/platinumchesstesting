"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import type { PlayerInfo } from "@/app/page"

interface MoveData {
  from: string
  to: string
  promotion?: string
}

export function useSocket(roomId: string, playerInfo: PlayerInfo) {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const opponentMoveCallback = useRef<((move: MoveData) => void) | null>(null)
  const opponentJoinCallback = useRef<((player: PlayerInfo) => void) | null>(null)
  const lastOpponentRef = useRef<PlayerInfo | null>(null)

  useEffect(() => {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost"
    const url = `http://${host}:3001`

    const socket = io(url, {
      path: "/socket.io",
      addTrailingSlash: false,
      transports: ["websocket"],
    })

    socketRef.current = socket

    socket.on("connect", () => {
      setIsConnected(true)
      socket.emit("join-room", { roomId, player: playerInfo })
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
    })

    socket.on("opponent-joined", (opponent: PlayerInfo) => {
      lastOpponentRef.current = opponent
      if (opponentJoinCallback.current) {
        opponentJoinCallback.current(opponent)
      }
    })

    socket.on("opponent-move", (move: MoveData) => {
      if (opponentMoveCallback.current) {
        opponentMoveCallback.current(move)
      }
    })

    socket.on("room-state", (state: { players: PlayerInfo[] }) => {
      const opponent = state.players.find((p) => p.id !== playerInfo.id)
      if (opponent) {
        lastOpponentRef.current = opponent
        if (opponentJoinCallback.current) {
          opponentJoinCallback.current(opponent)
        }
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [roomId, playerInfo])

  const sendMove = useCallback(
    (move: MoveData) => {
      socketRef.current?.emit("move", { roomId, move })
    },
    [roomId],
  )

  const onOpponentMove = useCallback((callback: (move: MoveData) => void) => {
    opponentMoveCallback.current = callback
  }, [])

  const onOpponentJoin = useCallback((callback: (player: PlayerInfo) => void) => {
    opponentJoinCallback.current = callback
    if (lastOpponentRef.current) {
      callback(lastOpponentRef.current)
    }
  }, [])

  return {
    sendMove,
    onOpponentMove,
    onOpponentJoin,
    isConnected,
  }
}
