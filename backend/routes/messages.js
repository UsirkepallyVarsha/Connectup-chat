const express = require("express");
const Message = require("../models/Message");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/messages/:otherId
 * Get full conversation between logged-in user and other user
 */
router.get("/:otherId", auth, async (req, res) => {
  try {
    const otherId = req.params.otherId;
    const meId = req.user.id;

    const messages = await Message.find({
      $or: [
        { from: meId, to: otherId },
        { from: otherId, to: meId }
      ]
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json(
      messages.map((m) => ({
        _id: m._id,
        from: m.from.toString(),
        to: m.to.toString(),
        content: m.content,
        createdAt: m.createdAt
      }))
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE /api/messages/conversation/:otherId
 * Delete entire conversation between logged-in user and other user
 */
router.delete("/conversation/:otherId", auth, async (req, res) => {
  try {
    const otherId = req.params.otherId;
    const meId = req.user.id;

    await Message.deleteMany({
      $or: [
        { from: meId, to: otherId },
        { from: otherId, to: meId }
      ]
    });

    res.json({ message: "Conversation deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE /api/messages/:id
 * Delete a single personal message.
 * Only sender can delete.
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    if (msg.from.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed to delete this message" });
    }

    await msg.deleteOne();

    res.json({ message: "Message deleted", id: req.params.id });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
