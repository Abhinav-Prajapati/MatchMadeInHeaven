// index.js
require('dotenv').config();  // Load environment variables from .env file
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require("fs");
const cors = require('cors');
const Game = require("./service.js");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins (or specify your frontend URL)
        methods: ["GET", "POST"]
    }
});

app.use(cors());

var quizzes;

// Load questions from json file
fs.readFile("./quizzes.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }
  quizzes = JSON.parse(data).quizzes;
});

const rooms = {}; // Store active games

app.get("/", (req, res) => {
    res.json({ message: "WebSocket Game Server is running!" });
});

io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on("joinGame", ({ roomId, playerName }) => {
        if (!rooms[roomId]) {
            rooms[roomId] = new Game(roomId, quizzes);
            rooms[roomId].setIo(io);
        }

        const game = rooms[roomId];

        if (game.addPlayer(socket.id, playerName)) {
            socket.join(roomId);
            console.log(`${playerName} joined room ${roomId}`);

            io.to(roomId).emit("playerJoined", {
                player: playerName,
                message: `${playerName} joined the game!`
            });

            if (Object.keys(game.players).length === 2) {
                io.to(roomId).emit("gameStart", "Game is starting!");
                game.startGame();
            }
        } else {
            socket.emit("roomFull", "Room is already full.");
        }
    });

    socket.on("submitAnswer", ({ roomId, answer }) => {
        const game = rooms[roomId];
        if (game) {
            game.submitAnswer(socket.id, answer);
        }
    });

    socket.on("nextQuestion", ({ roomId }) => {
      const game = rooms[roomId];
      if (game) {
          game.readyForNext(socket.id);
      }
  });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on ${process.env.SERVER_URL || "http://localhost"}:${PORT}`);
});
