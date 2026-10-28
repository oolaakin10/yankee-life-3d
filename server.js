const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3001);
const MAX_PLAYERS_PER_ROOM = 2;
const MAX_CONNECTIONS = Number(process.env.MAX_CONNECTIONS || 200);
const MAX_MESSAGES_PER_SECOND = 20;
const MAX_NAME_LENGTH = 22;
const MAX_AVATAR_LENGTH = 8;
const ROOM_PATTERN = /^[A-Z0-9_-]{1,16}$/;
const rooms = new Map();
const clients = new Map();

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  if (pathname === "/health" && (req.method === "GET" || req.method === "HEAD")) {
    return json(res, 200, { ok: true, service: "yankee-life-multiplayer", rooms: rooms.size, connections: clients.size });
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "content-type": "text/plain; charset=utf-8", "allow": "GET, HEAD", "x-content-type-options": "nosniff" });
    return res.end("Method not allowed");
  }
  if (pathname === "/" || pathname === "/index.html") {
    return fs.readFile(path.join(__dirname, "index.html"), (err, html) => {
      if (err) {
        res.writeHead(500, { "content-type": "text/plain; charset=utf-8", "x-content-type-options": "nosniff" });
        return res.end("Game page could not be loaded.");
      }
      res.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-cache",
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
        "x-frame-options": "DENY",
        "permissions-policy": "camera=(), microphone=(), geolocation=()",
      });
      if (req.method === "HEAD") return res.end();
      res.end(html);
    });
  }
  res.writeHead(404, { "content-type": "text/plain; charset=utf-8", "x-content-type-options": "nosniff" });
  res.end("Not found");
});

const wss = new WebSocket.Server({ server, maxPayload: 2048, perMessageDeflate: false });

function send(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}
function roomPlayers(room, excludeId) {
  const result = {};
  const members = rooms.get(room);
  if (!members) return result;
  for (const [id, p] of members) {
    if (id !== excludeId) result[id] = { name: p.name, x: p.x, y: p.y, avatar: p.avatar };
  }
  return result;
}
function broadcast(room, obj, excludeId) {
  const members = rooms.get(room);
  if (!members) return;
  for (const [id, p] of members) if (id !== excludeId) send(p.ws, obj);
}
function cleanText(value, fallback, maxLength) {
  if (typeof value !== "string") return fallback;
  return value.replace(/[<>\u0000-\u001f\u007f]/g, "").trim().slice(0, maxLength) || fallback;
}
function leave(ws) {
  const p = clients.get(ws);
  if (!p) return;
  const members = rooms.get(p.room);
  if (members) {
    members.delete(p.id);
    broadcast(p.room, { type: "left", id: p.id });
    if (members.size === 0) rooms.delete(p.room);
  }
  clients.delete(ws);
}
function heartbeat() {
  this.isAlive = true;
}
wss.on("connection", ws => {
  if (clients.size >= MAX_CONNECTIONS) {
    send(ws, { type: "error", message: "Server is busy. Try again shortly." });
    return ws.close(1013, "Server capacity reached");
  }
  ws.isAlive = true;
  ws.on("pong", heartbeat);
  let messageWindowStart = Date.now();
  let messagesInWindow = 0;
  ws.on("message", raw => {
    const now = Date.now();
    if (now - messageWindowStart >= 1000) {
      messageWindowStart = now;
      messagesInWindow = 0;
    }
    messagesInWindow++;
    if (messagesInWindow > MAX_MESSAGES_PER_SECOND) {
      send(ws, { type: "error", message: "Too many messages. Slow down." });
      return ws.close(1008, "Rate limit exceeded");
    }

    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return send(ws, { type: "error", message: "Invalid message." }); }
    if (!msg || typeof msg.type !== "string") return send(ws, { type: "error", message: "Invalid message type." });

    if (msg.type === "join") {
      if (clients.has(ws)) return send(ws, { type: "error", message: "Already joined a room." });
      const room = cleanText(msg.room, "TIMESQUARE", 16).toUpperCase();
      if (!ROOM_PATTERN.test(room)) return send(ws, { type: "error", message: "Invalid room code." });
      let members = rooms.get(room);
      if (!members) {
        members = new Map();
        rooms.set(room, members);
      }
      if (members.size >= MAX_PLAYERS_PER_ROOM) {
        if (members.size === 0) rooms.delete(room);
        send(ws, { type: "roomFull" });
        return ws.close(1008, "Room full");
      }
      const id = crypto.randomUUID();
      const player = {
        id, room, ws,
        name: cleanText(msg.name, "Player", MAX_NAME_LENGTH),
        avatar: cleanText(msg.avatar, "🧑", MAX_AVATAR_LENGTH),
        x: 0.5, y: 0.65,
        lastMove: 0,
      };
      members.set(id, player);
      clients.set(ws, player);
      send(ws, { type: "welcome", id, room, players: roomPlayers(room, id) });
      broadcast(room, { type: "players", players: roomPlayers(room) }, id);
      return;
    }

    const player = clients.get(ws);
    if (!player) return send(ws, { type: "error", message: "Join a room first." });
    if (msg.type === "move") {
      if (now - player.lastMove < 50) return;
      player.lastMove = now;
      const x = Number(msg.x), y = Number(msg.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      player.x = Math.max(0.02, Math.min(0.98, x));
      player.y = Math.max(0.02, Math.min(0.98, y));
      player.name = cleanText(msg.name, player.name, MAX_NAME_LENGTH);
      player.avatar = cleanText(msg.avatar, player.avatar, MAX_AVATAR_LENGTH);
      broadcast(player.room, {
        type: "playerMoved", id: player.id, name: player.name,
        x: player.x, y: player.y, avatar: player.avatar,
      }, player.id);
    }
  });
  ws.on("close", () => leave(ws));
  ws.on("error", () => leave(ws));
});

const heartbeatTimer = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);
heartbeatTimer.unref();

function shutdown() {
  clearInterval(heartbeatTimer);
  for (const ws of wss.clients) ws.close(1001, "Server restarting");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

server.listen(PORT, "0.0.0.0", () => console.log("YANKEE LIFE multiplayer server listening on " + PORT));
