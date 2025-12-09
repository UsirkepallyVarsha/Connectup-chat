const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

const Message = require("./models/Message");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 🔥 Store connected users
let onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // JOIN PERSONAL ROOM
  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.join(userId);

    console.log("User joined:", userId);
  });

  // RECEIVE MESSAGE
  socket.on("private_message", async (msgData) => {
    try {
      const { from, to, content } = msgData;

      // Save message to DB
      const savedMsg = await Message.create({
        from,
        to,
        content,
      });

      const finalMsg = savedMsg.toObject();

      // Send message to sender
      io.to(from).emit("private_message", finalMsg);

      // Send message to receiver
      io.to(to).emit("private_message", finalMsg);
    } catch (error) {
      console.log("Message error:", error);
    }
  });

  // DELETE MESSAGE
  socket.on("delete_message", (id) => {
    io.emit("message_deleted", { id });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    // remove user from online list
    for (let [u, s] of onlineUsers.entries()) {
      if (s === socket.id) onlineUsers.delete(u);
    }
  });
});

// ROUTES
app.get("/", (req, res) => {
  res.send("Chat API Running");
});

// IMPORT ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/groups", require("./routes/groupRoutes"));
app.use("/api/connections", require("./routes/connectionRoutes"));

// START SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
