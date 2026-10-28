const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const net = require("node:net");
const WebSocket = require("ws");

let child;
let baseUrl;
let wsUrl;

async function freePort() {
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  return port;
}
async function waitForServer(url) {
  const until = Date.now() + 8000;
  while (Date.now() < until) {
    if (child.exitCode !== null) throw new Error("Server exited before becoming ready");
    try {
      const response = await fetch(url + "/health");
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Server did not become ready");
}
before(async () => {
  const port = await freePort();
  baseUrl = "http://127.0.0.1:" + port;
  wsUrl = "ws://127.0.0.1:" + port;
  child = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), MAX_CONNECTIONS: "20" },
    stdio: "inherit",
  });
  await waitForServer(baseUrl);
});
after(async () => {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await new Promise(resolve => child.once("exit", resolve));
});
function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => reject(new Error("WebSocket open timed out")), 3000);
    ws.once("open", () => { clearTimeout(timer); resolve(ws); });
    ws.once("error", err => { clearTimeout(timer); reject(err); });
  });
}
function nextMessage(ws, predicate = () => true, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { ws.off("message", handler); reject(new Error("Timed out waiting for WebSocket message")); }, timeout);
    function handler(raw) {
      let value;
      try { value = JSON.parse(raw.toString()); } catch { return; }
      if (!predicate(value)) return;
      clearTimeout(timer);
      ws.off("message", handler);
      resolve(value);
    }
    ws.on("message", handler);
  });
}
function close(ws) {
  if (!ws || ws.readyState === WebSocket.CLOSED) return Promise.resolve();
  return new Promise(resolve => {
    ws.once("close", resolve);
    ws.close();
    setTimeout(() => { if (ws.readyState !== WebSocket.CLOSED) ws.terminate(); }, 500).unref();
  });
}

test("health endpoint responds with service status", async () => {
  const response = await fetch(baseUrl + "/health");
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.service, "yankee-life-multiplayer");
});

test("serves game page and rejects unknown paths", async () => {
  const home = await fetch(baseUrl + "/");
  assert.equal(home.status, 200);
  assert.match(await home.text(), /YANKEE LIFE/);
  const missing = await fetch(baseUrl + "/missing");
  assert.equal(missing.status, 404);
});

test("two players see each other and a third player cannot join a full room", async () => {
  const first = await connect();
  const second = await connect();
  let third;
  try {
    const firstJoined = nextMessage(first, m => m.type === "welcome");
    first.send(JSON.stringify({ type: "join", room: "TESTROOM", name: "First" }));
    const firstWelcome = await firstJoined;
    assert.ok(firstWelcome.id);

    const secondJoined = nextMessage(second, m => m.type === "welcome");
    const firstSeesSecond = nextMessage(first, m => m.type === "players");
    second.send(JSON.stringify({ type: "join", room: "TESTROOM", name: "Second" }));
    const secondWelcome = await secondJoined;
    assert.ok(secondWelcome.id);
    const joinedNotice = await firstSeesSecond;
    assert.ok(Object.keys(joinedNotice.players).length >= 1);

    const moved = nextMessage(first, m => m.type === "playerMoved");
    second.send(JSON.stringify({ type: "move", x: 0.7, y: 0.8, name: "Second" }));
    const movement = await moved;
    assert.equal(movement.name, "Second");
    assert.equal(movement.x, 0.7);
    assert.equal(movement.y, 0.8);

    third = await connect();
    const fullRoom = nextMessage(third, m => m.type === "roomFull");
    third.send(JSON.stringify({ type: "join", room: "TESTROOM", name: "Third" }));
    await fullRoom;
  } finally {
    await Promise.all([close(first), close(second), close(third)]);
  }
});
