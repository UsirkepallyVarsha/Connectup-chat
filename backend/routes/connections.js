const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /api/connections/people - list other users with relation status
router.get("/people", auth, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    const others = await User.find({ _id: { $ne: req.user.id } }).select(
      "name bio avatarUrl location friends pendingRequestsSent pendingRequestsReceived"
    );

    const result = others.map((u) => {
      const idStr = u._id.toString();
      const isFriend = me.friends.map(String).includes(idStr);
      const sent = me.pendingRequestsSent.map(String).includes(idStr);
      const received = me.pendingRequestsReceived.map(String).includes(idStr);
      let status = "none";
      if (isFriend) status = "friends";
      else if (sent) status = "request_sent";
      else if (received) status = "request_received";

      return {
        _id: u._id,
        name: u.name,
        bio: u.bio,
        avatarUrl: u.avatarUrl,
        location: u.location,
        status
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/connections/request/:id - send request
router.post("/request/:id", auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user.id)
      return res.status(400).json({ message: "Cannot connect to yourself" });

    const me = await User.findById(req.user.id);
    const other = await User.findById(targetId);
    if (!other) return res.status(404).json({ message: "User not found" });

    if (me.friends.includes(targetId))
      return res.status(400).json({ message: "Already friends" });

    if (!me.pendingRequestsSent.includes(targetId))
      me.pendingRequestsSent.push(targetId);
    if (!other.pendingRequestsReceived.includes(req.user.id))
      other.pendingRequestsReceived.push(req.user.id);

    await me.save();
    await other.save();

    res.json({ message: "Request sent" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/connections/accept/:id - accept request from user :id
router.post("/accept/:id", auth, async (req, res) => {
  try {
    const fromId = req.params.id;
    const me = await User.findById(req.user.id);
    const other = await User.findById(fromId);
    if (!other) return res.status(404).json({ message: "User not found" });

    // remove from pending
    me.pendingRequestsReceived = me.pendingRequestsReceived.filter(
      (uid) => uid.toString() !== fromId
    );
    other.pendingRequestsSent = other.pendingRequestsSent.filter(
      (uid) => uid.toString() !== req.user.id
    );

    // add to friends
    if (!me.friends.includes(fromId)) me.friends.push(fromId);
    if (!other.friends.includes(req.user.id)) other.friends.push(req.user.id);

    await me.save();
    await other.save();

    res.json({ message: "Request accepted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/connections/ignore/:id - ignore request from user :id
router.post("/ignore/:id", auth, async (req, res) => {
  try {
    const fromId = req.params.id;
    const me = await User.findById(req.user.id);
    const other = await User.findById(fromId);
    if (!other) return res.status(404).json({ message: "User not found" });

    me.pendingRequestsReceived = me.pendingRequestsReceived.filter(
      (uid) => uid.toString() !== fromId
    );
    other.pendingRequestsSent = other.pendingRequestsSent.filter(
      (uid) => uid.toString() !== req.user.id
    );

    await me.save();
    await other.save();

    res.json({ message: "Request ignored" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
