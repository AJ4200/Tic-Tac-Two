const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 4000;

const rooms = new Map();

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});

function createRoom(roomName) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, {
      players: [],
      symbols: {},
      board: Array(9).fill(null),
      turn: "X",
      status: "waiting",
      winner: null,
    });
  }
  return rooms.get(roomName);
}

function checkWin(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  if (board.every((cell) => cell !== null)) {
    return "draw";
  }

  return null;
}

function resetRoom(room) {
  room.board = Array(9).fill(null);
  room.turn = "X";
  room.winner = null;
  room.status = room.players.length === 2 ? "playing" : "waiting";
}

function serializeRoom(room) {
  return {
    board: room.board,
    turn: room.turn,
    status: room.status,
    winner: room.winner,
    playersCount: room.players.length,
  };
}

function getRequestRoomName(req) {
  return String(req.body.room || req.params.room || "main").trim() || "main";
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/rooms/join", (req, res) => {
  const roomName = getRequestRoomName(req);
  const room = createRoom(roomName);
  const providedPlayerId =
    typeof req.body.playerId === "string" && req.body.playerId.trim()
      ? req.body.playerId.trim()
      : null;
  const playerId = providedPlayerId || crypto.randomUUID();

  const alreadyInRoom = room.players.includes(playerId);
  const roomIsFull = room.players.length >= 2;

  if (!alreadyInRoom && roomIsFull) {
    return res.status(409).json({ error: "Room is full" });
  }

  if (!alreadyInRoom) {
    room.players.push(playerId);
  }

  if (!room.symbols[playerId]) {
    room.symbols[playerId] = Object.values(room.symbols).includes("X") ? "O" : "X";
  }

  if (room.players.length === 2 && room.status === "waiting") {
    resetRoom(room);
  }

  return res.json({
    room: roomName,
    playerId,
    symbol: room.symbols[playerId],
    state: serializeRoom(room),
  });
});

app.get("/api/rooms/:room", (req, res) => {
  const roomName = getRequestRoomName(req);
  const room = rooms.get(roomName);

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  const playerId =
    typeof req.query.playerId === "string" && req.query.playerId.trim()
      ? req.query.playerId.trim()
      : "";

  return res.json({
    room: roomName,
    symbol: playerId ? room.symbols[playerId] || null : null,
    state: serializeRoom(room),
  });
});

app.post("/api/rooms/:room/move", (req, res) => {
  const roomName = getRequestRoomName(req);
  const room = rooms.get(roomName);

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  const { playerId, index } = req.body;
  const parsedIndex = Number(index);

  if (typeof playerId !== "string" || !room.symbols[playerId]) {
    return res.status(400).json({ error: "Invalid playerId" });
  }

  if (!Number.isInteger(parsedIndex) || parsedIndex < 0 || parsedIndex > 8) {
    return res.status(400).json({ error: "Invalid move index" });
  }

  if (room.status !== "playing") {
    return res.status(409).json({ error: "Game is not in playing state" });
  }

  const symbol = room.symbols[playerId];
  if (symbol !== room.turn) {
    return res.status(409).json({ error: "Not your turn" });
  }

  if (room.board[parsedIndex] !== null) {
    return res.status(409).json({ error: "Cell already occupied" });
  }

  room.board[parsedIndex] = symbol;
  const winner = checkWin(room.board);
  if (winner) {
    room.status = "finished";
    room.winner = winner;
  } else {
    room.turn = room.turn === "X" ? "O" : "X";
  }

  return res.json({
    room: roomName,
    symbol,
    state: serializeRoom(room),
  });
});

app.post("/api/rooms/:room/rematch", (req, res) => {
  const roomName = getRequestRoomName(req);
  const room = rooms.get(roomName);

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  const { playerId } = req.body;
  if (typeof playerId !== "string" || !room.symbols[playerId]) {
    return res.status(400).json({ error: "Invalid playerId" });
  }

  resetRoom(room);

  return res.json({
    room: roomName,
    symbol: room.symbols[playerId],
    state: serializeRoom(room),
  });
});

app.post("/api/rooms/:room/leave", (req, res) => {
  const roomName = getRequestRoomName(req);
  const room = rooms.get(roomName);

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  const { playerId } = req.body;
  if (typeof playerId !== "string" || !playerId.trim()) {
    return res.status(400).json({ error: "Invalid playerId" });
  }

  room.players = room.players.filter((existingPlayerId) => existingPlayerId !== playerId);
  delete room.symbols[playerId];
  resetRoom(room);

  if (room.players.length === 0) {
    rooms.delete(roomName);
    return res.json({ room: roomName, deleted: true });
  }

  return res.json({
    room: roomName,
    deleted: false,
    state: serializeRoom(room),
  });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`ttt_server api listening on http://localhost:${PORT}`);
});
