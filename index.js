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
  
  socket.on('chat message', (msg) => {
    
    console.log('Message received: ' + msg);
    
    socket.broadcast.emit('chat message', msg);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  socket.on('join_room', (roomId)=>{
    socket.join(roomId);
    console.log(`User Joined room: ${roomId}`)
    socket.to(roomId).emit('system_message', 'A new user has joined room')
  })

  socket.on('chat_message',({room,message})=>{
    console.log(`Message received in room ${room}: ${message}`);
    io.to(room).emit('chat_message', message); 
  })
});


// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
