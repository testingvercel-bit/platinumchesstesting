import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { createServer } from "http";
import path from "path";
import next from "next";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { Chess } from "chess.js";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

type Color = "white" | "black";
type Player = { playerId: string; socketId: string; name?: string; userId?: string };
type Room = {
  id: string;
  chess: Chess;
  players: { white?: Player; black?: Player };
  createdAt: number;
  timeControl?: string;
  over?: boolean;
  drawOffer?: Color;
  stakeEachUsd?: number;
  stakePotUsd?: number;
};

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Supabase admin client for resolving emails by username
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

function pfEncode(val: string) {
  return encodeURIComponent(val)
    .replace(/%20/g, "+")
    .replace(/%[0-9a-f]{2}/g, m => m.toUpperCase());
}

function buildParamString(params: Record<string, string | number>) {
  const parts: string[] = [];
  for (const key of Object.keys(params)) {
    if (key === "signature") continue;
    const raw = params[key];
    const str = String(raw ?? "");
    if (str === "") continue;
    parts.push(`${key}=${pfEncode(str.trim())}`);
  }
  return parts.join("&");
}

function md5Signature(paramString: string, passphrase?: string) {
  const withPass = passphrase ? `${paramString}&passphrase=${pfEncode(passphrase.trim())}` : paramString;
  return crypto.createHash("md5").update(withPass).digest("hex");
}

async function usdToZar(amountUsd: number): Promise<number> {
  const rate = await getUsdZarRate();
  return +(amountUsd * rate).toFixed(2);
}

let fxCache: { rate: number; ts: number } | null = null;
const FX_TTL_MS = 5 * 60 * 1000;
async function getUsdZarRate(): Promise<number> {
  const fallbackRate = 20;
  const now = Date.now();
  if (fxCache && now - fxCache.ts < FX_TTL_MS) return fxCache.rate;

  const candidates = [
    process.env.FX_PROVIDER_URL,
    "https://open.er-api.com/v6/latest/USD",
    "https://api.exchangerate.host/latest?base=USD&symbols=ZAR"
  ].filter(Boolean) as string[];

  for (const url of candidates) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const json: any = await resp.json();
      let rate = Number(
        json?.rates?.ZAR ?? // er-api, exchangerate.host
        json?.result?.ZAR   // generic fallbacks
      );
      if (!isFinite(rate)) continue;
      if (rate < 5 || rate > 50) continue; // sanity bounds
      fxCache = { rate, ts: now };
      return rate;
    } catch {}
  }

  fxCache = { rate: fallbackRate, ts: now };
  return fallbackRate;
}

app.get("/auth/email-for-username/:username", async (req, res) => {
  try {
    const username = String(req.params.username || "").trim();
    if (!username) { res.status(400).json({ error: "Missing username" }); return; }
    if (!supabaseAdmin) { res.status(500).json({ error: "Supabase service role env not set" }); return; }
    const { data: prof, error: e1 } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (e1) { res.status(500).json({ error: e1.message }); return; }
    if (!prof?.id) { res.status(404).json({ error: "Username not found" }); return; }
    const { data: adminUser, error: e2 } = await supabaseAdmin.auth.admin.getUserById(prof.id);
    if (e2) { res.status(500).json({ error: e2.message }); return; }
    const email = adminUser?.user?.email;
    if (!email) { res.status(404).json({ error: "User email not found" }); return; }
    res.json({ email });
  } catch (err: any) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post("/payments/deposit/form", async (req, res) => {
  try {
    const merchantId = process.env.PAYFAST_MERCHANT_ID || "";
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY || "";
    const passphrase = process.env.PAYFAST_PASSPHRASE || undefined;
    const processUrl = process.env.PAYFAST_PROCESS_URL || "https://sandbox.payfast.co.za/eng/process";
    if (!merchantId || !merchantKey) { res.status(500).json({ error: "PayFast env not configured" }); return; }

    const amountUsd = Number(req.body?.amountUsd);
    const userId = String(req.body?.userId || "").trim();
    const username = String(req.body?.username || "").trim();
    if (!userId) { res.status(400).json({ error: "Missing userId" }); return; }
    if (!amountUsd || isNaN(amountUsd)) { res.status(400).json({ error: "Invalid amount" }); return; }
    if (amountUsd < 5) { res.status(400).json({ error: "Minimum deposit is 5 USD" }); return; }

    const amountZar = await usdToZar(amountUsd);
    const mPaymentId = `${userId}-${uuidv4()}`;

    const origin = process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SERVER_URL || process.env.RENDER_EXTERNAL_URL || `${req.protocol}://${req.get("host")}`;
    const returnUrl = `${origin}/payments/payfast/return`;
    const cancelUrl = `${origin}/payments/payfast/cancel`;
    const notifyUrl = `${origin}/payments/payfast/notify`;

    const fields: Record<string, string | number> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      m_payment_id: mPaymentId,
      amount: amountZar.toFixed(2),
      item_name: "Account Deposit",
      item_description: username ? `Deposit for ${username}` : "Account top-up",
      custom_str1: userId,
      custom_str2: amountUsd.toFixed(2),
    };

    const paramString = buildParamString(fields);
    const signature = md5Signature(paramString, passphrase);

    res.json({ processUrl, fields: { ...fields, signature } });
  } catch (err: any) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.get("/fx/usd-zar", async (_req, res) => {
  try {
    const rate = await getUsdZarRate();
    res.json({ base: "USD", quote: "ZAR", rate });
  } catch (err: any) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post("/payments/payfast/notify", async (req, res) => {
  try {
    res.status(200).end();
    const pfData: Record<string, any> = { ...req.body };
    Object.keys(pfData).forEach(k => { if (typeof pfData[k] === "string") pfData[k] = pfData[k].replace(/\\/g, ""); });
    const passphrase = process.env.PAYFAST_PASSPHRASE || undefined;
    const paramString = buildParamString(pfData);
    const validSig = (pfData.signature || "").toLowerCase() === md5Signature(paramString, passphrase);
    let proceed = validSig;
    if (!proceed) {
      try {
        const url = (process.env.PAYFAST_PROCESS_URL || "https://sandbox.payfast.co.za/eng/process").includes("sandbox")
          ? "https://sandbox.payfast.co.za/eng/query/validate"
          : "https://www.payfast.co.za/eng/query/validate";
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: paramString
        });
        const text = await resp.text();
        if ((text || "").trim().toUpperCase() === "VALID") proceed = true;
      } catch {}
    }
    if (!proceed) return;
    if (String(pfData.payment_status) !== "COMPLETE") return;
    const userId = String(pfData.custom_str1 || "").trim();
    const amountUsd = Number(pfData.custom_str2 || 0);
    const pfPaymentId = String(pfData.pf_payment_id || "").trim();
    if (!userId || !amountUsd) return;
    if (!supabaseAdmin) return;
    const { data: prof, error: eSel } = await supabaseAdmin.from("profiles").select("balance_usd").eq("id", userId).maybeSingle();
    if (eSel) { console.error("PF ITN select error", eSel.message); return; }
    const prev = Number((prof as any)?.balance_usd || 0);
    const next = +(prev + amountUsd).toFixed(2);
    const { error: eUpd } = await supabaseAdmin.from("profiles").update({ balance_usd: next }).eq("id", userId);
    if (eUpd) { console.error("PF ITN update error", eUpd.message); return; }
    try {
      await supabaseAdmin.from("transactions").insert({ type: "deposit", pf_payment_id: pfPaymentId, amount_usd: amountUsd, user_id: userId, status: "complete" });
    } catch {}
  } catch {}
});

app.get("/payments/payfast/return", (_req, res) => {
  const origin = process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SERVER_URL || process.env.RENDER_EXTERNAL_URL || "";
  res.redirect(`${origin || ""}/deposit/success`);
});

app.get("/payments/payfast/cancel", (_req, res) => {
  const origin = process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SERVER_URL || process.env.RENDER_EXTERNAL_URL || "";
  res.redirect(`${origin || ""}/deposit/cancel`);
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
  transports: ["websocket"],
  pingTimeout: 30000,
  pingInterval: 25000,
  path: "/socket.io"
});

const rooms = new Map<string, Room>();
const waitingQueues = new Map<string, { playerId: string; socketId: string; userId: string; stakeUsd: number }[]>();

async function setupSocketAdapter() {
  const url = process.env.REDIS_URL || "";
  if (!url) return;
  try {
    const { createAdapter } = await import("@socket.io/redis-adapter");
    const { createClient } = await import("redis");
    const pub = createClient({ url });
    const sub = pub.duplicate();
    await pub.connect();
    await sub.connect();
    io.adapter(createAdapter(pub, sub));
    console.log("Socket adapter: Redis enabled");
  } catch (err) {
    console.error("Socket adapter setup failed");
  }
}

setupSocketAdapter().catch(() => {});

function getOrCreateRoom(roomId: string): Room {
  let room = rooms.get(roomId);
  if (!room) {
    room = { id: roomId, chess: new Chess(), players: {}, createdAt: Date.now() };
    rooms.set(roomId, room);
  }
  return room;
}

function colorForPlayer(room: Room, playerId: string): Color | undefined {
  if (room.players.white && room.players.white.playerId === playerId) return "white";
  if (room.players.black && room.players.black.playerId === playerId) return "black";
  return undefined;
}

function assignColor(room: Room, playerId: string, socketId: string): Color | undefined {
  const existing = colorForPlayer(room, playerId);
  if (existing) {
    const p = existing === "white" ? room.players.white : room.players.black;
    if (p) p.socketId = socketId;
    return existing;
  }
  if (!room.players.white) {
    room.players.white = { playerId, socketId };
    return "white";
  }
  if (!room.players.black) {
    room.players.black = { playerId, socketId };
    return "black";
  }
  return undefined;
}

function gameStatePayload(room: Room) {
  return {
    roomId: room.id,
    fen: room.chess.fen(),
    turn: room.chess.turn() === "w" ? "white" : "black",
    history: room.chess.history({ verbose: true }),
    players: {
      white: room.players.white?.playerId,
      black: room.players.black?.playerId,
    },
    timeControl: room.timeControl,
    stakeEachUsd: room.stakeEachUsd,
    stakePotUsd: room.stakePotUsd
  };
}

function gameOverReason(chess: Chess) {
  if (chess.isCheckmate()) return "checkmate";
  if (chess.isStalemate()) return "stalemate";
  if (chess.isThreefoldRepetition()) return "threefold";
  if (chess.isInsufficientMaterial()) return "insufficient";
  if (chess.isDraw()) return "draw";
  return "over";
}

async function getBalanceUsd(userId: string): Promise<number | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.from("profiles").select("balance_usd").eq("id", userId).maybeSingle();
  if (error) return null;
  return Number((data as any)?.balance_usd ?? 0);
}

async function setBalanceUsd(userId: string, next: number): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { error } = await supabaseAdmin.from("profiles").update({ balance_usd: +(next.toFixed(2)) }).eq("id", userId);
  return !error;
}

async function insertTransaction(entry: Record<string, any>) {
  try { if (supabaseAdmin) await supabaseAdmin.from("transactions").insert(entry); } catch {}
}

async function recordGame(room: Room, winnerUserId: string | null, loserUserId: string | null, result: string) {
  try {
    if (!supabaseAdmin) return;
    const payload: any = {
      room_id: room.id,
      white_id: room.players.white?.userId || null,
      black_id: room.players.black?.userId || null,
      winner_id: winnerUserId,
      loser_id: loserUserId,
      stake_usd: room.stakeEachUsd || null,
      pot_usd: room.stakePotUsd || null,
      result,
    };
    await supabaseAdmin.from("games").insert(payload);
  } catch {}
}

io.on("connection", socket => {
  console.log("socket connected", socket.id);
  socket.on("queueForTime", async (payload: { time: string; playerId: string; userId: string; stakeUsd: number }) => {
    const { time, playerId, userId, stakeUsd } = payload;
    if (!time || !playerId) return;
    const key = `${time}|${Math.max(0, Math.floor(stakeUsd * 100))}`;
    const queue = waitingQueues.get(key) || [];
    if (!queue.find(q => q.playerId === playerId)) {
      queue.push({ playerId, socketId: socket.id, userId, stakeUsd: Number(stakeUsd) || 0 });
      waitingQueues.set(key, queue);
    }
    console.log("queueForTime", { time, playerId, stakeUsd, queueLength: queue.length });
    if (queue.length >= 2) {
      const a = queue.shift()!;
      const b = queue.shift()!;
      waitingQueues.set(key, queue);
      const stakeEach = Math.max(0, Math.floor((a.stakeUsd || 0) * 100) / 100);
      // Validate equal stake
      if (stakeEach <= 0 || Math.abs(stakeEach - (b.stakeUsd || 0)) > 1e-9) {
        io.to(a.socketId).emit("queueRejected", { reason: "Stake mismatch" });
        io.to(b.socketId).emit("queueRejected", { reason: "Stake mismatch" });
        return;
      }
      // Ensure balances and escrow
      const balA = await getBalanceUsd(a.userId);
      const balB = await getBalanceUsd(b.userId);
      if (balA == null || balB == null) {
        io.to(a.socketId).emit("queueRejected", { reason: "Balance unavailable" });
        io.to(b.socketId).emit("queueRejected", { reason: "Balance unavailable" });
        return;
      }
      if ((balA as number) < stakeEach) { io.to(a.socketId).emit("queueRejected", { reason: "Insufficient funds" }); waitingQueues.set(key, [b, ...queue]); return; }
      if ((balB as number) < stakeEach) { io.to(b.socketId).emit("queueRejected", { reason: "Insufficient funds" }); waitingQueues.set(key, [a, ...queue]); return; }
      const nextA = +(Math.max(0, (balA as number) - stakeEach).toFixed(2));
      const nextB = +(Math.max(0, (balB as number) - stakeEach).toFixed(2));
      const okA = await setBalanceUsd(a.userId, nextA);
      if (!okA) { io.to(a.socketId).emit("queueRejected", { reason: "Escrow failed" }); waitingQueues.set(key, [a, b, ...queue]); return; }
      await insertTransaction({ type: "stake_debit", amount_usd: stakeEach, user_id: a.userId, room_id: undefined, status: "complete" });
      const okB = await setBalanceUsd(b.userId, nextB);
      if (!okB) {
        // refund A
        await setBalanceUsd(a.userId, balA as number);
        await insertTransaction({ type: "stake_refund", amount_usd: stakeEach, user_id: a.userId, room_id: undefined, status: "complete" });
        io.to(b.socketId).emit("queueRejected", { reason: "Escrow failed" });
        waitingQueues.set(key, [a, b, ...queue]);
        return;
      }
      await insertTransaction({ type: "stake_debit", amount_usd: stakeEach, user_id: b.userId, room_id: undefined, status: "complete" });

      const roomId = uuidv4();
      const room = getOrCreateRoom(roomId);
      room.timeControl = time;
      room.over = false;
      room.stakeEachUsd = stakeEach;
      room.stakePotUsd = +(stakeEach * 2).toFixed(2);
      io.to(a.socketId).emit("paired", { roomId, time });
      io.to(b.socketId).emit("paired", { roomId, time });
    }
  });
  socket.on("joinGame", async (payload: { roomId: string; playerId: string; name?: string; userId?: string }) => {
    const { roomId, playerId, name, userId } = payload;
    const room = getOrCreateRoom(roomId);
    socket.join(roomId);

    // Idempotent join: Check if player is already in the room
    let assigned = colorForPlayer(room, playerId);
    
    if (assigned) {
        // Player already exists, update socket ID
        if (assigned === "white" && room.players.white) room.players.white.socketId = socket.id;
        if (assigned === "black" && room.players.black) room.players.black.socketId = socket.id;
    } else {
        // New player, assign color
        assigned = assignColor(room, playerId, socket.id);
    }

    console.log("joinGame", { roomId, playerId, assigned, socketId: socket.id });
    
    if (assigned) {
      io.to(socket.id).emit("colorAssigned", { color: assigned });
    }
    
    // Update user details if provided
    if (assigned === "white" && room.players.white) { 
        if (userId) room.players.white.userId = userId; 
        if (name) room.players.white.name = name; 
    }
    if (assigned === "black" && room.players.black) { 
        if (userId) room.players.black.userId = userId; 
        if (name) room.players.black.name = name; 
    }

    // Send game state to the reconnecting/joining socket
    io.to(socket.id).emit("gameState", gameStatePayload(room));

    // Resolve names if missing
    let whiteName = room.players.white?.name;
    let blackName = room.players.black?.name;
    
    if (!whiteName && room.players.white?.userId && supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin.from("profiles").select("username").eq("id", room.players.white.userId).maybeSingle();
        whiteName = (data as any)?.username || undefined;
        if (whiteName && room.players.white) room.players.white.name = whiteName;
      } catch {}
    }
    if (!blackName && room.players.black?.userId && supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin.from("profiles").select("username").eq("id", room.players.black.userId).maybeSingle();
        blackName = (data as any)?.username || undefined;
        if (blackName && room.players.black) room.players.black.name = blackName;
      } catch {}
    }
    
    // Broadcast player names to the room (so everyone sees who is who)
    io.to(roomId).emit("playerNames", {
      white: whiteName || undefined,
      black: blackName || undefined
    });
    
    // Also notify that a player joined/reconnected
    io.to(roomId).emit("playerJoined", { playerId, color: assigned });
  });
  socket.on("setName", async (payload: { roomId: string; playerId: string; name: string }) => {
    const { roomId, playerId, name } = payload;
    const room = rooms.get(roomId);
    if (!room) return;
    const color = colorForPlayer(room, playerId);
    if (!color) return;
    if (color === "white" && room.players.white) room.players.white.name = name;
    if (color === "black" && room.players.black) room.players.black.name = name;
    let whiteName = room.players.white?.name;
    let blackName = room.players.black?.name;
    if (!whiteName && room.players.white?.userId && supabaseAdmin) {
      try { const { data } = await supabaseAdmin.from("profiles").select("username").eq("id", room.players.white.userId).maybeSingle(); whiteName = (data as any)?.username || undefined; } catch {}
    }
    if (!blackName && room.players.black?.userId && supabaseAdmin) {
      try { const { data } = await supabaseAdmin.from("profiles").select("username").eq("id", room.players.black.userId).maybeSingle(); blackName = (data as any)?.username || undefined; } catch {}
    }
    io.to(roomId).emit("playerNames", { white: whiteName || undefined, black: blackName || undefined });
  });

  socket.on("sendChat", (payload: { roomId: string; playerId: string; text: string; name?: string }) => {
    const { roomId, text, name } = payload;
    if (!text || !text.trim()) return;
    const room = rooms.get(roomId);
    if (!room) return;
    const ts = Date.now();
    io.to(roomId).emit("chatMessage", { text, name, ts });
  });

  socket.on(
    "makeMove",
    async (payload: { roomId: string; playerId: string; from: string; to: string; promotion?: string }) => {
      const { roomId, playerId, from, to, promotion } = payload;
      console.log("makeMove:received", { roomId, playerId, from, to });
      const room = rooms.get(roomId);
      if (!room) { io.to(socket.id).emit("moveRejected", { reason: "room not found" }); return; }
      if (room.over) { io.to(socket.id).emit("moveRejected", { reason: "game over" }); return; }
      const playerColor = colorForPlayer(room, playerId);
      if (!playerColor) { io.to(socket.id).emit("moveRejected", { reason: "not in room" }); return; }
      const turnColor = room.chess.turn() === "w" ? "white" : "black";
      if (playerColor !== turnColor) { io.to(socket.id).emit("moveRejected", { reason: "not your turn" }); return; }
      
      try {
        const move = room.chess.move({ from, to, promotion: promotion || undefined });
        if (!move) throw new Error("illegal move"); // Should be caught by catch block if move throws, but for safety
        
        console.log("makeMove", { roomId, playerId, from, to, san: move.san });
        io.to(roomId).emit("moveMade", {
          from: move.from,
          to: move.to,
          san: move.san,
          fen: room.chess.fen()
        });
        io.to(roomId).emit("gameState", gameStatePayload(room));
        if (room.chess.isGameOver()) {
          room.over = true;
          const reason = gameOverReason(room.chess);
          io.to(roomId).emit("gameOver", { reason });
          // settle
          const loserColor = room.chess.turn() === "w" ? "white" : "black";
          const winnerColor = loserColor === "white" ? "black" : "white";
          await settleRoom(room, reason === "draw" ? null : winnerColor, reason);
        }
      } catch (err: any) {
        console.error("makeMove error", err);
        io.to(socket.id).emit("moveRejected", { reason: "illegal move" });
      }
    }
  );

  socket.on("flag", (payload: { roomId: string; loser: "white" | "black" }) => {
    const { roomId, loser } = payload;
    const room = rooms.get(roomId);
    if (!room || room.over) return;
    room.over = true;
    io.to(roomId).emit("gameOver", { reason: "timeout", loser });
    const winnerColor = loser === "white" ? "black" : "white";
    settleRoom(room, winnerColor, "timeout").catch(() => {});
  });

  socket.on("resign", (payload: { roomId: string; playerId: string }) => {
    const { roomId, playerId } = payload;
    const room = rooms.get(roomId);
    if (!room || room.over) return;
    const loser = colorForPlayer(room, playerId);
    if (!loser) return;
    room.over = true;
    io.to(roomId).emit("gameOver", { reason: "resign", loser });
    const winnerColor = loser === "white" ? "black" : "white";
    settleRoom(room, winnerColor, "resign").catch(() => {});
  });

  socket.on("offerDraw", (payload: { roomId: string; playerId: string }) => {
    const { roomId, playerId } = payload;
    const room = rooms.get(roomId);
    if (!room || room.over) return;
    const from = colorForPlayer(room, playerId);
    if (!from) return;
    room.drawOffer = from;
    io.to(roomId).emit("drawOffered", { from });
  });

  socket.on("acceptDraw", (payload: { roomId: string; playerId: string }) => {
    const { roomId, playerId } = payload;
    const room = rooms.get(roomId);
    if (!room || room.over) return;
    const color = colorForPlayer(room, playerId);
    if (!color) return;
    if (room.drawOffer && room.drawOffer !== color) {
      room.over = true;
      room.drawOffer = undefined;
      io.to(roomId).emit("gameOver", { reason: "draw" });
      settleRoom(room, null, "draw").catch(() => {});
    }
  });

  socket.on("declineDraw", (payload: { roomId: string; playerId: string }) => {
    const { roomId, playerId } = payload;
    const room = rooms.get(roomId);
    if (!room || room.over) return;
    const color = colorForPlayer(room, playerId);
    if (!color) return;
    if (room.drawOffer) {
      room.drawOffer = undefined;
      io.to(roomId).emit("drawDeclined", { by: color });
    }
  });

  socket.on("disconnect", () => {
    console.log("socket disconnected", socket.id);
  });
});

async function settleRoom(room: Room, winnerColor: Color | null, reason: string) {
  try {
    const whiteUser = room.players.white?.userId || null;
    const blackUser = room.players.black?.userId || null;
    const stakeEach = room.stakeEachUsd || 0;
    const pot = room.stakePotUsd || 0;
    if (winnerColor === null) {
      // draw: refund each stake
      if (whiteUser && stakeEach > 0) {
        const bw = await getBalanceUsd(whiteUser);
        if (bw != null) await setBalanceUsd(whiteUser, +(bw + stakeEach));
        await insertTransaction({ type: "stake_refund", amount_usd: stakeEach, user_id: whiteUser, room_id: room.id, status: "complete" });
      }
      if (blackUser && stakeEach > 0) {
        const bb = await getBalanceUsd(blackUser);
        if (bb != null) await setBalanceUsd(blackUser, +(bb + stakeEach));
        await insertTransaction({ type: "stake_refund", amount_usd: stakeEach, user_id: blackUser, room_id: room.id, status: "complete" });
      }
      await recordGame(room, null, null, reason);
      return;
    }
    const winnerUser = winnerColor === "white" ? whiteUser : blackUser;
    const loserUser = winnerColor === "white" ? blackUser : whiteUser;
    if (winnerUser && pot > 0) {
      const bw = await getBalanceUsd(winnerUser);
      if (bw != null) await setBalanceUsd(winnerUser, +(bw + pot));
      await insertTransaction({ type: "stake_payout", amount_usd: pot, user_id: winnerUser, room_id: room.id, status: "complete" });
    }
    await recordGame(room, winnerUser || null, loserUser || null, reason);
  } catch {}
}

app.get("/games/recent/:userId", async (req, res) => {
  try {
    const userId = String(req.params.userId || "").trim();
    const limit = Math.max(1, Math.min(50, parseInt(String(req.query.limit || "5"), 10) || 5));
    const offset = Math.max(0, parseInt(String(req.query.offset || "0"), 10) || 0);
    if (!supabaseAdmin) { res.status(500).json({ error: "Supabase not configured" }); return; }
    const { data: games, error } = await supabaseAdmin
      .from("games")
      .select("room_id, white_id, black_id, winner_id, loser_id, stake_usd, pot_usd, result, created_at")
      .or(`white_id.eq.${userId},black_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) { res.status(500).json({ error: error.message }); return; }
    const oppIds = Array.from(new Set((games || []).map((g: any) => (g.white_id === userId ? g.black_id : g.white_id)).filter(Boolean)));
    let usernames: Record<string, string> = {};
    if (oppIds.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id,username").in("id", oppIds);
      for (const p of (profs || []) as any[]) usernames[p.id] = p.username;
    }
    const rows = (games || []).map((g: any) => {
      const opponentId = g.white_id === userId ? g.black_id : g.white_id;
      const win = g.winner_id && g.winner_id === userId;
      const lose = g.loser_id && g.loser_id === userId;
      let delta = 0;
      if (g.result === "draw") delta = 0;
      else if (win) delta = +(g.stake_usd * 2);
      else if (lose) delta = -+(g.stake_usd);
      return {
        roomId: g.room_id,
        opponentId,
        opponentName: usernames[opponentId] || (opponentId ? String(opponentId).slice(0, 8) : "Opponent"),
        stakeUsd: g.stake_usd,
        potUsd: g.pot_usd,
        result: g.result,
        deltaUsd: delta,
        createdAt: g.created_at,
      };
    });
    res.json({ games: rows });
  } catch (err: any) {
    res.status(500).json({ error: String(err?.message || err) });
  }
});

const PORT = parseInt(process.env.PORT || "3000", 10);

async function start() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const nextDir = path.resolve(__dirname, "../../frontend");
  const dev = (process.env.NODE_ENV || "").toLowerCase() !== "production";
  const nextApp = next({ dev, dir: nextDir });
  const handle = nextApp.getRequestHandler();
  console.log("Starting server on port", PORT);
  await nextApp.prepare();

  app.all("*", (req, res) => {
    handle(req, res);
  });

  httpServer.listen(PORT, () => { console.log("Server listening", PORT); });
}

start().catch(err => {
  console.error("Failed to start server", err);
  process.exit(1);
});
