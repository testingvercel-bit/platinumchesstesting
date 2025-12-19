"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { ChessGame, useChessGameContext } from "@react-chess-tools/react-chess-game";
import { io, Socket } from "socket.io-client";
import { getSupabase } from "@/lib/supabaseClient";

type Color = "white" | "black";

export default function Game({ roomId }: { roomId: string }) {
  const [color, setColor] = useState<Color | undefined>(undefined);
  const [fen, setFen] = useState<string>(new Chess().fen());
  const [status, setStatus] = useState<string>("");
  const [turn, setTurn] = useState<Color | undefined>(undefined);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [drawOfferFrom, setDrawOfferFrom] = useState<Color | undefined>(undefined);
  const [drawPending, setDrawPending] = useState<boolean>(false);
  const [timeControl, setTimeControl] = useState<string>("");
  const [stakePotUsd, setStakePotUsd] = useState<number>(0);
  const [whiteMs, setWhiteMs] = useState<number>(0);
  const [blackMs, setBlackMs] = useState<number>(0);
  const incMsRef = useRef<number>(0);
  const lastTickRef = useRef<number>(Date.now());
  const clocksInitializedRef = useRef<boolean>(false);
  const isReplayingRef = useRef<boolean>(false);
  const [meName, setMeName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const joinedWithUserRef = useRef<boolean>(false);
  const [whiteName, setWhiteName] = useState<string>("");
  const [blackName, setBlackName] = useState<string>("");
  const [messages, setMessages] = useState<{ name?: string; text: string; ts: number }[]>([]);
  const [chatText, setChatText] = useState<string>("");
  const [history, setHistory] = useState<any[]>([]);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const socketRef = useRef<Socket | null>(null);
  const chessRef = useRef<Chess>(new Chess());
  const lastServerFenRef = useRef<string>(fen);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const playerId = useMemo(() => {
    const key = "platinumchess-player-id";
    const existing = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    if (existing) return existing;
    const id = crypto.randomUUID();
    if (typeof window !== "undefined") window.localStorage.setItem(key, id);
    return id;
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const socket = io({ transports: ["websocket"], path: "/socket.io", reconnection: true, reconnectionAttempts: Infinity, reconnectionDelayMax: 5000 });
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("joinGame", { roomId, playerId, name: meName, userId });
    });
    socket.on("connect_error", (err: any) => {
      setStatus("Connection error");
      console.debug("socket connect_error", err);
    });
    socket.on("error", (err: any) => {
      console.debug("socket error", err);
    });
    socket.on("colorAssigned", (p: { color: Color }) => {
      setColor(p.color);
      setGameOver(false);
    });
    socket.on("gameState", (p: { fen: string; turn: Color; history: any[]; timeControl?: string; players?: { white?: string; black?: string }; stakePotUsd?: number }) => {
      console.debug("socket gameState", { turn: p.turn, histLen: (p.history || []).length });
      chessRef.current.load(p.fen);
      setFen(p.fen);
      setStatus(`${p.turn} to move`);
      setTurn(p.turn);
      setDrawOfferFrom(undefined);
      setDrawPending(false);
      lastServerFenRef.current = p.fen;
      setHistory(p.history || []);
      setReplayIndex((p.history || []).length);
      const tc = p.timeControl || "";
      setTimeControl(tc);
      setStakePotUsd(Number(p.stakePotUsd || 0));
      if (tc && !clocksInitializedRef.current) {
        const [base, inc] = tc.split("+").map(x => parseInt(x, 10));
        const baseMs = Math.max(0, (base || 0) * 60 * 1000);
        const incMs = Math.max(0, (inc || 0) * 1000);
        setWhiteMs(baseMs);
        setBlackMs(baseMs);
        incMsRef.current = incMs;
        lastTickRef.current = Date.now();
        clocksInitializedRef.current = true;
      }
    });
    socket.on("playerNames", (names: { white?: string; black?: string }) => {
      if (typeof names.white === "string") setWhiteName(names.white);
      if (typeof names.black === "string") setBlackName(names.black);
    });
    socket.on("moveMade", (p: { fen: string; san?: string; history?: any[] }) => {
      console.debug("socket moveMade", { san: p.san });
      try { chessRef.current.load(p.fen); } catch {}
      setFen(p.fen);
      if (Array.isArray(p.history)) {
        setHistory(p.history);
        setReplayIndex((p.history || []).length);
      }
      const mover = chessRef.current.turn() === "w" ? "black" : "white";
      if (mover === "white") setWhiteMs(ms => ms + incMsRef.current);
      else setBlackMs(ms => ms + incMsRef.current);
      const nextTurn = chessRef.current.turn() === "w" ? "white" : "black";
      setTurn(nextTurn);
      setStatus(`${nextTurn} to move`);
      lastServerFenRef.current = p.fen;
      lastTickRef.current = Date.now();
    });
    socket.on("drawOffered", (p: { from: Color }) => {
      setDrawOfferFrom(p.from);
      setDrawPending(color === p.from);
      if (color && p.from !== color) setStatus("Opponent offered a draw");
      else setStatus("Draw offer sent");
    });
    socket.on("drawDeclined", (p: { by: Color }) => {
      setDrawOfferFrom(undefined);
      setDrawPending(false);
      setStatus("Draw offer declined");
    });
    socket.on("gameOver", (p: { reason: string }) => {
      setStatus(`Game over: ${p.reason}`);
      setGameOver(true);
      setDrawOfferFrom(undefined);
      setDrawPending(false);
    });
    socket.on("moveRejected", (p: { reason?: string }) => {
      setStatus(p.reason ? `Move rejected: ${p.reason}` : "Move rejected");
      try {
        chessRef.current.load(lastServerFenRef.current);
      } catch {}
      setFen(lastServerFenRef.current);
      const nextTurn = chessRef.current.turn() === "w" ? "white" : "black";
      setTurn(nextTurn);
    });
    socket.on("chatMessage", (m: { name?: string; text: string; ts: number }) => {
      setMessages(prev => [...prev, m].slice(-200));
    });
    return () => {
      socket.disconnect();
    };
  }, [roomId, playerId]);

  useEffect(() => {
    const s = socketRef.current;
    if (!s || !s.connected) return;
    if (userId && !joinedWithUserRef.current) {
      s.emit("joinGame", { roomId, playerId, name: meName, userId });
      joinedWithUserRef.current = true;
    }
  }, [userId, meName, roomId, playerId]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.emit("setName", { roomId, playerId, name: meName });
    }
  }, [meName, roomId, playerId]);

  useEffect(() => {
    const s = getSupabase();
    s.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      setUserId(user.id);
      const { data: prof } = await s.from("profiles").select("username").eq("id", user.id).maybeSingle();
      setMeName(((prof as any)?.username as string) || (user.email as string) || "");
    });
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      const turnColor = chessRef.current.turn() === "w" ? "white" : "black";
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      if (turnColor === "white") {
        setWhiteMs(ms => {
          const next = ms - delta;
          if (next <= 0) {
            socketRef.current?.emit("flag", { roomId, loser: "white" });
            return 0;
          }
          return next;
        });
      } else {
        setBlackMs(ms => {
          const next = ms - delta;
          if (next <= 0) {
            socketRef.current?.emit("flag", { roomId, loser: "black" });
            return 0;
          }
          return next;
        });
      }
    }, 200);
    return () => clearInterval(t);
  }, [roomId, gameOver]);

  function fmt(ms: number) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    const t = chatText.trim();
    if (!t) return;
    socketRef.current?.emit("sendChat", { roomId, playerId, text: t, name: meName });
    setChatText("");
  }

  function applyReplay(idx: number) {
    const c = new Chess();
    const moves = history.slice(0, Math.max(0, Math.min(idx, history.length)));
    for (const m of moves) {
      c.move({ from: m.from, to: m.to, promotion: m.promotion });
    }
    isReplayingRef.current = true;
    setFen(c.fen());
    setReplayIndex(moves.length);
    setTimeout(() => { isReplayingRef.current = false; }, 0);
  }

  function resign() {
    if (gameOver) return;
    socketRef.current?.emit("resign", { roomId, playerId });
  }

  function offerDraw() {
    if (gameOver) return;
    if (drawOfferFrom) return;
    socketRef.current?.emit("offerDraw", { roomId, playerId });
  }

  function acceptDraw() {
    if (gameOver) return;
    if (!drawOfferFrom || (color && drawOfferFrom === color)) return;
    socketRef.current?.emit("acceptDraw", { roomId, playerId });
  }

  function declineDraw() {
    if (gameOver) return;
    if (!drawOfferFrom || (color && drawOfferFrom === color)) return;
    socketRef.current?.emit("declineDraw", { roomId, playerId });
  }

  const opponentName = color === "white" ? (blackName || "Opponent") : color === "black" ? (whiteName || "Opponent") : "Opponent";
  const playerName = color === "white" ? (whiteName || meName) : color === "black" ? (blackName || meName) : meName;
  const opponentTime = color === "white" ? blackMs : whiteMs;
  const playerTime = color === "white" ? whiteMs : blackMs;

  return (
    <div className="min-h-screen w-full bg-[#161512] pb-safe">
      <div className="max-w-[1600px] mx-auto lg:grid lg:grid-cols-[minmax(300px,340px)_1fr_minmax(280px,320px)] lg:gap-4 xl:gap-6 lg:px-4 xl:px-6 lg:py-6">
        
        {/* Left Sidebar - Moves & Controls - Desktop */}
        <div className="hidden lg:block space-y-3">
          <div className="bg-[#262421] px-4 py-3 border border-[#3d3d37]">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Prize Pool</div>
            <div className="text-2xl font-bold text-emerald-400">${stakePotUsd.toFixed(2)}</div>
          </div>

          {/* Opponent Info */}
          <div className="bg-[#262421] px-4 py-3 border border-[#3d3d37] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#3d3d37] flex items-center justify-center text-sm font-medium">
                {opponentName[0]?.toUpperCase()}
              </div>
              <div className="text-sm font-medium text-gray-200">{opponentName}</div>
            </div>
            <div className={`text-xl font-mono font-semibold ${opponentTime < 30000 ? 'text-red-400' : 'text-gray-200'}`}>
              {fmt(opponentTime)}
            </div>
          </div>


          {/* Player Info */}
          <div className="bg-[#262421] px-4 py-3 border border-[#3d3d37] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 flex items-center justify-center text-sm font-medium text-white">
                {playerName[0]?.toUpperCase()}
              </div>
              <div className="text-sm font-medium text-gray-200">{playerName}</div>
            </div>
            <div className={`text-xl font-mono font-semibold ${playerTime < 30000 ? 'text-red-400' : 'text-gray-200'}`}>
              {fmt(playerTime)}
            </div>
          </div>

          <div className="bg-[#262421] border border-[#3d3d37] overflow-hidden">
            <div className="px-4 py-2 bg-[#1a1916] border-b border-[#3d3d37]">
              <div className="text-xs text-gray-400 uppercase tracking-wider">Moves</div>
            </div>
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => applyReplay(0)} disabled={replayIndex <= 0} className="p-1.5 hover:bg-[#3d3d37] disabled:opacity-30 disabled:hover:bg-transparent transition-colors" aria-label="First">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L12 12L18 18M12 6L6 12L12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button onClick={() => applyReplay(replayIndex - 1)} disabled={replayIndex <= 0} className="p-1.5 hover:bg-[#3d3d37] disabled:opacity-30 disabled:hover:bg-transparent transition-colors" aria-label="Previous">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <div className="text-xs text-gray-400">{replayIndex} / {history.length}</div>
                <button onClick={() => applyReplay(replayIndex + 1)} disabled={replayIndex >= history.length} className="p-1.5 hover:bg-[#3d3d37] disabled:opacity-30 disabled:hover:bg-transparent transition-colors" aria-label="Next">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button onClick={() => applyReplay(history.length)} disabled={replayIndex >= history.length} className="p-1.5 hover:bg-[#3d3d37] disabled:opacity-30 disabled:hover:bg-transparent transition-colors" aria-label="Last">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6L12 12L6 18M12 6L18 12L12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
              <div className="max-h-[340px] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-1 text-sm">
                  {history.map((m, i) => {
                    const moveNum = Math.floor(i / 2) + 1;
                    const isWhite = i % 2 === 0;
                    return (
                      <div key={i} className={`px-2 py-1 ${i < replayIndex ? 'bg-[#3d3d37] text-gray-200' : 'text-gray-500'}`}>
                        {isWhite && <span className="text-gray-400 mr-1">{moveNum}.</span>}
                        <span className="font-medium">{m.san}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#262421] px-4 py-3 border border-[#3d3d37]">
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={resign} 
                disabled={gameOver} 
                className="px-3 py-2.5 text-gray-200 font-medium text-sm disabled:opacity-50"
                aria-label="Resign"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 21V5" />
                  <path d="M4 5h9l-2 3 2 3H4" />
                </svg>
              </button>
              {!drawOfferFrom && (
                <button 
                  onClick={offerDraw} 
                  disabled={gameOver || drawPending} 
                  className="px-3 py-2.5 text-gray-200 font-medium text-lg disabled:opacity-50"
                  title="Offer Draw"
                >
                  1/2
                </button>
              )}
            </div>
            {drawOfferFrom && color && drawOfferFrom !== color && !gameOver && (
              <div className="mt-2 flex gap-2">
                <button 
                  onClick={acceptDraw} 
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors"
                >
                  Accept Draw
                </button>
                <button 
                  onClick={declineDraw} 
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-colors"
                >
                  Decline
                </button>
              </div>
            )}
            {drawOfferFrom && color && drawOfferFrom === color && !gameOver && (
              <div className="mt-2 text-center text-sm text-gray-400">Draw offer sent...</div>
            )}
          </div>
        </div>

        {/* Center - Chess Board */}
        <div className="flex flex-col">
          <div className="lg:hidden mx-0 mt-2 px-0 py-2 text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Prize Pool</div>
            <div className="text-2xl font-bold text-emerald-400">${stakePotUsd.toFixed(2)}</div>
          </div>
          {/* Mobile: Opponent Info */}
          <div className="lg:hidden mx-0 mt-2 px-0 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-200">{opponentName}</div>
            </div>
            <div className={`text-lg font-mono font-semibold ${opponentTime < 30000 ? 'text-red-400' : 'text-gray-200'}`}>
              {fmt(opponentTime)}
            </div>
          </div>

          {/* Board Container */}
          <div className="flex-1 flex items-center justify-center p-0 lg:p-0">
            <div className="w-full max-w-[600px] aspect-square">
              {gameOver && (
                <div className="mb-2 text-center py-2 bg-[#262421] border border-[#3d3d37]">
                  <div className="text-sm font-medium text-gray-200">{status}</div>
                </div>
              )}
              <div className="relative w-full h-full overflow-hidden shadow-2xl">
                <ChessGame.Root fen={fen} orientation={color === "black" ? "b" : "w"}>
                  <BoardBridge fen={fen} color={color} />
                  <SyncBridge 
                    roomId={roomId} 
                    playerId={playerId} 
                    socket={socketRef} 
                    lastServerFenRef={lastServerFenRef} 
                    color={color} 
                    turn={turn} 
                    isReplayingRef={isReplayingRef} 
                  />
                  <ChessGame.Sounds />
                  {color && turn && color === turn && <ChessGame.KeyboardControls />}
                </ChessGame.Root>
                {(!color || !turn || color !== turn) && (
                  <div className="absolute inset-0" style={{ pointerEvents: "auto", cursor: "default" }} />
                )}
              </div>
            </div>
          </div>

          {/* Mobile: Player Info above moves */}
          <div className="lg:hidden mx-0 mb-2 px-0 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-200">{playerName}</div>
            </div>
            <div className={`text-lg font-mono font-semibold ${playerTime < 30000 ? 'text-red-400' : 'text-gray-200'}`}>
              {fmt(playerTime)}
            </div>
          </div>

          <div className="lg:hidden mx-0 mb-2 px-0 py-2">
            <div className="flex items-center gap-2 justify-between">
              <button onClick={() => applyReplay(0)} disabled={replayIndex <= 0} className="p-2 hover:bg-[#3d3d37] disabled:opacity-30 disabled:hover:bg-transparent" aria-label="First">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L12 12L18 18M12 6L6 12L12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={() => applyReplay(replayIndex - 1)} disabled={replayIndex <= 0} className="p-2 hover:bg-[#3d3d37] disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Previous">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <div className="flex-1 overflow-x-auto no-scrollbar whitespace-nowrap text-sm text-gray-300">
                {history.map((m, i) => (
                  <span key={i} className={`mr-2 ${i < replayIndex ? 'text-gray-100' : 'text-gray-500'}`}>{m.san}</span>
                ))}
              </div>
              <button onClick={() => applyReplay(replayIndex + 1)} disabled={replayIndex >= history.length} className="p-2 hover:bg-[#3d3d37] disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Next">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={() => applyReplay(history.length)} disabled={replayIndex >= history.length} className="p-2 hover:bg-[#3d3d37] disabled:opacity-30 disabled:hover:bg-transparent" aria-label="Last">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6L12 12L6 18M12 6L18 12L12 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>

          

          {/* Mobile: Game Controls */}
          <div className="lg:hidden mx-0 mb-2 px-0 py-3">
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={resign} 
                disabled={gameOver} 
                className="px-3 py-2.5 text-gray-200 font-medium text-sm disabled:opacity-50"
                aria-label="Resign"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 21V5" />
                  <path d="M4 5h9l-2 3 2 3H4" />
                </svg>
              </button>
              {!drawOfferFrom && (
                <button 
                  onClick={offerDraw} 
                  disabled={gameOver || drawPending} 
                  className="px-3 py-2.5 text-gray-200 font-medium text-lg disabled:opacity-50"
                  title="Offer Draw"
                >
                  1/2
                </button>
              )}
            </div>
            {drawOfferFrom && color && drawOfferFrom !== color && !gameOver && (
              <div className="mt-2 flex gap-2">
                <button onClick={acceptDraw} className="flex-1 py-2 bg-emerald-600 text-white font-medium text-sm">
                  Accept Draw
                </button>
                <button onClick={declineDraw} className="flex-1 py-2 bg-red-600 text-white font-medium text-sm">
                  Decline
                </button>
              </div>
            )}
            {drawOfferFrom && color && drawOfferFrom === color && !gameOver && (
              <div className="mt-2 text-center text-sm text-gray-400">Draw offer sent...</div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Chat */}
        <div className="lg:block space-y-3 flex flex-col lg:max-h-[calc(100vh-3rem)]">
          {/* Desktop: Stake Display */}
          <div className="hidden lg:block bg-[#262421] px-4 py-3 border border-[#3d3d37]">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Prize Pool</div>
            <div className="text-2xl font-bold text-emerald-400">${stakePotUsd.toFixed(2)}</div>
          </div>

          {/* Chat */}
          <div className="bg-[#262421] border border-[#3d3d37] flex flex-col flex-1 lg:min-h-0">
            <div className="px-4 py-2 bg-[#1a1916] border-b border-[#3d3d37]">
              <div className="text-xs text-gray-400 uppercase tracking-wider">Chat</div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 min-h-[200px] lg:min-h-0">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">No messages yet</div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className="mb-2 text-sm break-words">
                    <span className="font-semibold text-emerald-400">{m.name || "Player"}: </span>
                    <span className="text-gray-200">{m.text}</span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendChat} className="p-3 border-t border-[#3d3d37] bg-[#1a1916]">
              <div className="flex gap-2">
                <input 
                  value={chatText} 
                  onChange={e => setChatText(e.target.value)} 
                  placeholder="Type a message..." 
                  className="flex-1 px-3 py-2 bg-[#262421] text-gray-200 border border-[#3d3d37] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm placeholder-gray-500"
                />
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1916;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3d3d37;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4a4a42;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
}

function BoardBridge({ fen, color }: { fen: string; color: Color | undefined }) {
  const ctx = useChessGameContext();
  useEffect(() => {
    ctx.methods.setPosition(fen, color === "black" ? "b" : "w");
  }, [fen, color]);
  return (
    <ChessGame.Board
      options={{
        showNotation: true,
        animationDurationInMs: 300,
      }}
    />
  );
}

function SyncBridge({ roomId, playerId, socket, lastServerFenRef, color, turn, isReplayingRef }: { 
  roomId: string; 
  playerId: string; 
  socket: React.MutableRefObject<Socket | null>; 
  lastServerFenRef: React.MutableRefObject<string>; 
  color: Color | undefined; 
  turn: Color | undefined; 
  isReplayingRef: React.MutableRefObject<boolean> 
}) {
  const ctx = useChessGameContext();
  const lastHistLenRef = useRef<number>((ctx.game.history({ verbose: true }) as any[]).length);
  useEffect(() => {
    const hist = ctx.game.history({ verbose: true }) as any[];
    const len = hist.length;
    if (len === lastHistLenRef.current) return;
    lastHistLenRef.current = len;
    if (isReplayingRef.current) return;
    if (!color || !turn || color !== turn) {
      ctx.methods.setPosition(lastServerFenRef.current, color === "black" ? "b" : "w");
      return;
    }
    const last = hist[len - 1];
    if (last && last.from && last.to) {
      const promotion = last.promotion;
      console.debug("emit makeMove", { roomId, playerId, from: last.from, to: last.to, promotion });
      socket.current?.emit("makeMove", { roomId, playerId, from: last.from, to: last.to, promotion });
    }
  }, [ctx.currentFen, ctx.currentMoveIndex, color, turn]);
  return null;
}
