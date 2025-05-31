const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' folder
app.use(express.static(__dirname + '/public'));

// Define allowed secret rooms here
const allowedRooms = new Set([
  'JayashreeJolik2025',   // Example secret room names
  'LoveNest1234',
  'SecretCoupleRoom'
]);

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', (room, username) => {
    if (!allowedRooms.has(room)) {
      // Invalid room - reject join by disconnecting
      socket.emit('roomError', 'Invalid room name. Access denied.');
      socket.disconnect();
      console.log(`User ${username} tried to join invalid room: ${room}`);
      return;
    }

    socket.join(room);
    socket.room = room;
    socket.username = username;
    console.log(`${username} joined room ${room}`);

    // Notify this client that join succeeded, so chat UI can show
    socket.emit('joinRoomSuccess');

    // Notify others in the room
    socket.to(room).emit('chatMessage', { sender: 'System', text: `${username} joined the room.` });
  });

  socket.on('chatMessage', (msg) => {
    const room = socket.room;
    if (!room) return;  // Ignore if user not in a room

    // Broadcast message to the room (including sender)
    io.to(room).emit('chatMessage', msg);
  });

  socket.on('disconnect', () => {
    if (socket.room && socket.username) {
      io.to(socket.room).emit('chatMessage', { sender: 'System', text: `${socket.username} left the chat.` });
    }
    console.log('A user disconnected');
  });
});

http.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
