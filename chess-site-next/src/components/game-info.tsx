"use client"

import { cn } from "@/lib/utils"
import type { PlayerInfo } from "@/app/page"
import { User, Clock } from "lucide-react"

interface GameInfoProps {
  player: PlayerInfo
  isCurrentTurn: boolean
  position: "top" | "bottom"
}

export function GameInfo({ player, isCurrentTurn, position }: GameInfoProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[512px] flex items-center gap-3 p-3 rounded-lg transition-colors",
        position === "top" ? "mb-2" : "mt-2",
        isCurrentTurn ? "bg-primary/20 border border-primary/30" : "bg-card border border-border",
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          player.color === "white" ? "bg-white text-gray-900" : "bg-gray-900 text-white",
        )}
      >
        <User className="h-5 w-5" />
      </div>

      <div className="flex-1">
        <p className="font-medium text-foreground">{player.name || "Waiting..."}</p>
        <p className="text-sm text-muted-foreground capitalize">{player.color}</p>
      </div>

      {isCurrentTurn && (
        <div className="flex items-center gap-1 text-primary">
          <Clock className="h-4 w-4 animate-pulse" />
          <span className="text-sm font-medium">Your turn</span>
        </div>
      )}
    </div>
  )
}
