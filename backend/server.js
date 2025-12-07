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




const PORT = process.env.PORT || 5000;







// ... your existing middleware (express.json(), cors, etc.)




// ... other routes and app.listen(...)



dotenv.config();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
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

// simple in-memory map of online users: userId -> socketId
const onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("join_group", (groupId) => {
  if (groupId) {
    socket.join(groupId);
  }
});

socket.on("group_message", async ({ groupId, from, content }) => {
  try {
    const msgDoc = await GroupMessage.create({ group: groupId, sender: from, content });
    const payload = {
      _id: msgDoc._id,
      group: groupId,
      sender: from,
      content,
      createdAt: msgDoc.createdAt
    };
    io.to(groupId).emit("group_message", payload);
  } catch (err) {
    console.error("Error saving group message:", err.message);
  }
});

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
      createdAt: msgDoc.createdAt
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



