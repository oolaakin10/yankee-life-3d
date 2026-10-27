const WebSocket = require("ws");
const http = require("http");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3001);
const MAX_PLAYERS_PER_ROOM = 2;
const rooms = new Map();
const clients = new Map();

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ok: true, service: "yankee-life-multiplayer" }));
  }
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("YANKEE LIFE multiplayer server is running. Health: /health\n");
});

const wss = new WebSocket.Server({ server, maxPayload: 2048 });

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
wss.on("connection", ws => {
  ws.on("message", raw => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return send(ws, { type: "error", message: "Invalid message." }); }
    if (!msg || typeof msg.type !== "string") return;

    if (msg.type === "join") {
      if (clients.has(ws)) return;
      const room = String(msg.room || "TIMESQUARE").toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 16);
      if (!room) return send(ws, { type: "error", message: "Invalid room code." });
      if (!rooms.has(room)) rooms.set(room, new Map());
      const members = rooms.get(room);
      if (members.size >= MAX_PLAYERS_PER_ROOM) return send(ws, { type: "roomFull" });
      const id = crypto.randomUUID();
      const player = {
        id, room, ws,
        name: String(msg.name || "Player").replace(/[<>]/g, "").slice(0, 22),
        avatar: String(msg.avatar || "🧑").slice(0, 8),
        x: 0.5, y: 0.65,
        lastMove: 0
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
      const now = Date.now();
      if (now - player.lastMove < 40) return;
      player.lastMove = now;
      // Validate and clamp client coordinates; this prototype relays presence only.
      const x = Number(msg.x), y = Number(msg.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      player.x = Math.max(0.02, Math.min(0.98, x));
      player.y = Math.max(0.02, Math.min(0.98, y));
      player.name = String(msg.name || player.name).replace(/[<>]/g, "").slice(0, 22);
      player.avatar = String(msg.avatar || player.avatar).slice(0, 8);
      broadcast(player.room, {
        type: "playerMoved", id: player.id, name: player.name,
        x: player.x, y: player.y, avatar: player.avatar
      }, player.id);
    }
  });
  ws.on("close", () => leave(ws));
  ws.on("error", () => leave(ws));
});
server.listen(PORT, "0.0.0.0", () => console.log(`YANKEE LIFE multiplayer server listening on ${PORT}`));
