// index.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require("fs");
const Game = require("./service.js")

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Load questions from json file
fs.readFile("./quizzes.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }
  const quizzes = JSON.parse(data).quizzes;
});

const rooms = {}; // Store active games

app.get("/", (req, res) => {
    res.json({ message: "WebSocket Game Server is running!" });
});

io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on("joinGame", ({ roomId, playerName }) => {
        if (!rooms[roomId]) {
            rooms[roomId] = new Game(roomId, [
                { id: 1, question: "Who takes longer in the shower?" },
                { id: 2, question: "Who makes better dinner?" },
                { id: 3, question: "Who is more likely to forget an anniversary?" }
            ]);
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

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
