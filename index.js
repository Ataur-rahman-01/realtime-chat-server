const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");
const { addUser, removeUser, getUser, getUserInRoom } = require("./users.js");
const PORT = process.env.PORT || 5000;
const router = require("./router");

const app = express();
const server = http.createServer(app);
// const io = socketio(server);
app.use(router);
app.use(cors());
// server-side
const io = require("socket.io")(server, {
  cors: {
    origin: "https://realtime-chat-app-socket-io.netlify.app/",
    methods: ["GET", "POST"],
  },
});
io.on("connection", (socket) => {
  console.log("we have new connection");
  socket.on("join", ({ name, room }, callback) => {
    console.log(name, room);
    const { error, user } = addUser({ id: socket.id, name, room });
    if (error) {
      return callback(error);
    }
    socket.emit("message", {
      user: "Admin",
      text: `${user.name},Welcome to the room ${user.room}`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "Admin", text: `${user.name} joined` });

    socket.join(user.room);
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUserInRoom(user.room),
    });
    callback();
  });
  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit("message", { user: user.name, text: message });
    callback();
  });
  socket.on("disconnects", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", {
        user: "Admin",
        text: `${user.name} has left`,
      });
    }
    console.log("user left");
  });
});

server.listen(PORT, () => {
  console.log(`server is run on port ${PORT}`);
});
