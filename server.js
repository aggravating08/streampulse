import http from "node:http";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { WebSocket, WebSocketServer } from "ws";
import { createPoll, vote, publicPoll, parseVote } from "./poll.js";
const port = Number(process.env.PORT || 4317),
  token = randomBytes(24).toString("hex");
let poll = null,
  twitch = null,
  channel = "",
  status = "Not connected",
  reconnectTimer = null,
  attempt = 0,
  chatVotes = 0;
const clients = new Map();
function state() {
  return {
    poll: publicPoll(poll),
    channel,
    status,
    chatVotes,
    clients: clients.size,
    uptime: Math.round(process.uptime()),
  };
}
function broadcast() {
  for (const c of clients.keys())
    if (c.readyState === 1)
      c.send(JSON.stringify({ type: "state", ...state() }));
}
function connect(name) {
  clearTimeout(reconnectTimer);
  if (twitch) {
    twitch.removeAllListeners();
    twitch.on("error", () => {});
    twitch.close();
  }
  channel = name;
  attempt = 0;
  join();
}
function join() {
  status = "Connecting";
  broadcast();
  const current = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
  twitch = current;
  current.on("open", () => {
    current.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
    if (process.env.TWITCH_OAUTH_TOKEN && process.env.TWITCH_USERNAME) {
      current.send(
        "PASS oauth:" + process.env.TWITCH_OAUTH_TOKEN.replace(/^oauth:/, ""),
      );
      current.send("NICK " + process.env.TWITCH_USERNAME.toLowerCase());
    } else
      current.send(
        "NICK justinfan" + Math.floor(Math.random() * 900000 + 100000),
      );
    current.send("JOIN #" + channel);
  });
  current.on("message", (raw) => {
    for (const line of raw.toString().split("\r\n")) {
      if (line.startsWith("PING ")) current.send("PONG " + line.slice(5));
      if (line.includes(" 366 ")) {
        status = "Connected";
        attempt = 0;
        broadcast();
      }
      const v = parseVote(line);
      if (v && vote(poll, "twitch:" + v.user, v.index)) {
        chatVotes++;
        broadcast();
      }
    }
  });
  current.on("error", () => {
    status = "Connection error";
    broadcast();
  });
  current.on("close", () => {
    if (twitch !== current) return;
    status = "Reconnecting";
    broadcast();
    reconnectTimer = setTimeout(join, Math.min(30000, 1000 * 2 ** attempt++));
  });
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cache-Control", "no-store");
  if (url.pathname === "/api/state") {
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify(state()));
  }
  if (url.pathname.startsWith("/api/") && req.method === "POST") {
    if (req.headers.authorization !== "Bearer " + token) {
      res.writeHead(401);
      return res.end("Unauthorised");
    }
    try {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 4096) throw Error("Request too large");
      }
      const data = JSON.parse(body || "{}");
      if (url.pathname === "/api/poll")
        poll = createPoll(data.question, data.options);
      else if (url.pathname === "/api/close") {
        if (poll) poll.open = false;
      } else if (url.pathname === "/api/disconnect") {
        clearTimeout(reconnectTimer);
        if (twitch) {
          twitch.removeAllListeners();
          twitch.on("error", () => {});
          twitch.close();
          twitch = null;
        }
        channel = "";
        status = "Not connected";
      } else if (url.pathname === "/api/connect") {
        if (!/^[a-zA-Z0-9_]{3,25}$/.test(data.channel || ""))
          throw Error("Enter a valid Twitch channel name.");
        connect(data.channel.toLowerCase());
      } else if (url.pathname === "/api/demo-vote") {
        if (!vote(poll, "demo:" + randomBytes(5).toString("hex"), data.index))
          throw Error("Open a poll first.");
      } else {
        res.writeHead(404);
        return res.end();
      }
      broadcast();
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(state()));
    } catch (e) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  const routes = {
    "/": "index.html",
    "/overlay": "overlay.html",
    "/app.js": "app.js",
    "/style.css": "style.css",
  };
  if (!routes[url.pathname]) {
    res.writeHead(404);
    return res.end("Not found");
  }
  try {
    const file = routes[url.pathname];
    res.setHeader(
      "Content-Type",
      file.endsWith(".css")
        ? "text/css"
        : file.endsWith(".js")
          ? "text/javascript"
          : "text/html",
    );
    res.end(await readFile(new URL("./public/" + file, import.meta.url)));
  } catch {
    res.writeHead(500);
    res.end("Unable to load app");
  }
});
const wss = new WebSocketServer({ server, maxPayload: 1024 });
const heartbeat = setInterval(() => {
  for (const ws of clients.keys()) {
    if (!clients.get(ws)) {
      ws.terminate();
      continue;
    }
    clients.set(ws, false);
    ws.ping();
  }
}, 15000);
heartbeat.unref();
wss.on("connection", (ws, req) => {
  const origin = req.headers.origin;
  if (origin && origin !== `http://${req.headers.host}`) {
    ws.close(1008, "Invalid origin");
    return;
  }
  ws.on("error", () => {});
  clients.set(ws, true);
  ws.on("pong", () => clients.set(ws, true));
  ws.send(JSON.stringify({ type: "state", ...state() }));
  ws.on("message", (data) => {
    try {
      const m = JSON.parse(data);
      if (m.type === "ping")
        ws.send(JSON.stringify({ type: "pong", sent: m.sent }));
    } catch {}
  });
  ws.on("close", () => {
    clients.delete(ws);
    broadcast();
  });
  broadcast();
});
server.listen(port, "127.0.0.1", () =>
  console.log(
    `StreamPulse studio: http://127.0.0.1:${port}/#${token}\nOBS overlay: http://127.0.0.1:${port}/overlay`,
  ),
);
