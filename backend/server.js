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

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://connectup-chat-onhz.vercel.app",
      "https://connectup-chat.vercel.app",
      "https://connectup.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

app.use("/api/auth", require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/connections", require("./routes/connections"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/groups", require("./routes/groups"));
app.use("/api/group-messages", require("./routes/groupMessages"));

app.get("/", (req, res) => {
  res.send("API running");
});

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://connectup-chat-onhz.vercel.app",
      "https://connectup-chat.vercel.app",
      "https://connectup.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔵 NEW SOCKET CONNECTION:", socket.id);

  socket.on("join_group", (groupId) => {
    console.log("🏠 JOIN GROUP:", groupId, socket.id);
    if (groupId) {
      socket.join(groupId);
      console.log("✅ Joined group:", groupId);
    }
  });

  socket.on("group_message", async ({ groupId, from, content }) => {
    console.log("📣 GROUP MSG:", { groupId, from, content });
    try {
      const msgDoc = await GroupMessage.create({ group: groupId, sender: from, content });
      const payload = {
        _id: msgDoc._id,
        group: groupId,
        sender: from,
        content,
        createdAt: msgDoc.createdAt,
      };
      console.log("💾 Saved, broadcasting to:", groupId);
      io.to(groupId).emit("group_message", payload);
      console.log("✨ Broadcast done");
    } catch (err) {
      console.error("❌ Group msg error:", err.message);
    }
  });

  socket.on("join", (userId) => {
    console.log("👤 USER JOIN:", userId, socket.id);
    if (userId) {
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
    }
  });

  socket.on("private_message", async ({ from, to, content }) => {
    console.log("📩 PRIVATE MSG:", { from, to });
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
      console.error("❌ Private msg error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 DISCONNECT:", socket.id);
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
