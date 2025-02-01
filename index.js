// index.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
  res.json({message:"Server is up and running"})
});

io.on('connection', (socket) => {
  
  console.log(`A user connected ${socket.id}`);
  
  socket.on('join', (roomId) => {
    console.log(`Joined room ${roomId}`);
    socket.join(roomId);
  });
  
  socket.on('chat', (data) => {
    const msg = data.msg
    const roomId = data.roomId
    console.log(`Msg from ${roomId} : msg ${msg}`);
    socket.to(roomId).emit('chat', msg);
  });

  socket.on('public', (msg) => {
    console.log(`Msg in public channel : ${msg}`);
    socket.broadcast.emit('public', msg);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
