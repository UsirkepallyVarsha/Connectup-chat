const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const Message = require("./models/Message");
const GroupMessage = require("./models/GroupMessage");
const Group = require("./models/Group");
const path = require("path");

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);

// CORS for normal HTTP API
app.use(
  cors({
    origin: ["http://localhost:3000", "https://connectup-chat-onhz.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

// ROUTES
app.use("/api/auth", require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/connections", require("./routes/connections"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/groups", require("./routes/groups"));
app.use("/api/group-messages", require("./routes/groupMessages"));

app.get("/", (req, res) => {
  res.send("API running");
});

// SOCKET.IO with same origins
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://connectup-chat-onhz.vercel.app"],
    methods: ["GET", "POST"],
  },
});

// simple in-memory map of online users: userId -> socketId
const onlineUsers = new Map();

io.on("connection", (socket) => {
  // GROUPS
  socket.on("join_group", (groupId) => {
    if (groupId) socket.join(groupId);
  });

  socket.on("group_message", async ({ groupId, from, content }) => {
    try {
      const msgDoc = await GroupMessage.create({ group: groupId, sender: from, content });
      const payload = {
        _id: msgDoc._id,
        group: groupId,
        sender: from,
        content,
        createdAt: msgDoc.createdAt,
      };
      io.to(groupId).emit("group_message", payload);
    } catch (err) {
      console.error("Error saving group message:", err.message);
    }
  });

  // PERSONAL CHAT
  socket.on("join", (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
    }
  });

  socket.on("private_message", async ({ from, to, content }) => {
    try {
      const msgDoc = await Message.create({ from, to, content });

      const payload = {
        _id: msgDoc._id,
        from: msgDoc.from.toString(),
        to: msgDoc.to.toString(),
        content: msgDoc.content,
        createdAt: msgDoc.createdAt,
      };

      const targetSocketId = onlineUsers.get(to);
      if (targetSocketId) {
        io.to(targetSocketId).emit("private_message", payload);
      }
      socket.emit("private_message", payload);
    } catch (err) {
      console.error("Error saving message:", err.message);
    }
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
