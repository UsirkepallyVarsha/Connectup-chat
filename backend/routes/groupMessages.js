const express = require("express");
const GroupMessage = require("../models/GroupMessage");
const Group = require("../models/Group");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * DELETE /api/group-messages/:id
 * Delete a single group message.
 * Allowed if:
 *  - user is the sender of the message, OR
 *  - user is admin of that group.
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const msg = await GroupMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    const group = await Group.findById(msg.group);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const userId = req.user.id;
    const isAdmin = group.admin.toString() === userId.toString();
    const isSender = msg.sender.toString() === userId.toString();

    if (!isAdmin && !isSender) {
      return res
        .status(403)
        .json({ message: "Not allowed to delete this message" });
    }

    await msg.deleteOne();

    // Optional: if you want to notify clients via socket.io, you can emit from here
    // For that, you would need access to io instance (commonly stored on app.locals / req.app)

    res.json({ message: "Group message deleted", id: req.params.id });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
