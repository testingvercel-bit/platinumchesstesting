"use client"

import type { Chess } from "chess.js"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History } from "lucide-react"

interface MoveHistoryProps {
  game: Chess
}

export function MoveHistory({ game }: MoveHistoryProps) {
  const history = game.history()
  const pairs: string[][] = []

  for (let i = 0; i < history.length; i += 2) {
    pairs.push([history[i], history[i + 1] || ""])
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <History className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium text-foreground">Move History</h3>
      </div>

      <ScrollArea className="h-64">
        <div className="p-3 space-y-1">
          {pairs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No moves yet</p>
          ) : (
            pairs.map((pair, index) => (
              <div key={index} className="flex items-center text-sm font-mono">
                <span className="w-8 text-muted-foreground">{index + 1}.</span>
                <span className="w-16 text-foreground">{pair[0]}</span>
                <span className="w-16 text-foreground">{pair[1]}</span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
