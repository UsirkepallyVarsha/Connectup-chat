const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const sharp = require("sharp");
const Group = require("../models/Group");
const GroupMessage = require("../models/GroupMessage");
const auth = require("../middleware/auth");

const router = express.Router();

// multer for logo upload
const upload = multer({
  dest: path.join(__dirname, "..", "uploads", "temp"),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, or WEBP images are allowed"));
    }
    cb(null, true);
  }
});

const isAdmin = (group, userId) =>
  group.admin.toString() === userId.toString();

// GET /api/groups - list all groups + user role per group
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const groups = await Group.find({}).lean();

    const result = groups.map((g) => {
      const adminMatch = g.admin.toString() === userId;
      const memberMatch = g.members.some((m) => m.toString() === userId);
      const pendingMatch = g.pendingMembers.some(
        (m) => m.toString() === userId
      );

      let role = "none";
      if (adminMatch) role = "admin";
      else if (memberMatch) role = "member";
      else if (pendingMatch) role = "pending";

      return {
        _id: g._id,
        name: g.name,
        description: g.description,
        logoUrl: g.logoUrl,
        admin: g.admin,
        role
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/groups - create group; creator is admin + first member
router.post("/", auth, async (req, res) => {
  try {
    const { name, description, logoUrl } = req.body;
    if (!name) return res.status(400).json({ message: "Name required" });

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim() || "",
      logoUrl: logoUrl?.trim() || "",
      admin: req.user.id,
      members: [req.user.id],
      pendingMembers: []
    });

    res.status(201).json(group);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/groups/:id - edit group (admin only)
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, description, logoUrl } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!isAdmin(group, req.user.id)) {
      return res.status(403).json({ message: "Only admin can edit group" });
    }

    if (name !== undefined && name.trim()) {
      group.name = name.trim();
    }
    if (description !== undefined) {
      group.description = description.trim();
    }
    if (logoUrl !== undefined) {
      group.logoUrl = logoUrl.trim();
    }

    await group.save();
    res.json(group);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/groups/:id/messages - only members can read
router.get("/:id/messages", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).lean();
    if (!group) return res.status(404).json({ message: "Group not found" });

    const userId = req.user.id;
    const isMember =
      group.admin.toString() === userId ||
      group.members.some((m) => m.toString() === userId);

    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    const msgs = await GroupMessage.find({ group: req.params.id })
      .sort({ createdAt: 1 })
      .populate("sender", "name")
      .lean();

    res.json(
      msgs.map((m) => ({
        _id: m._id,
        group: m.group.toString(),
        sender: m.sender._id.toString(),
        senderName: m.sender.name,
        content: m.content,
        createdAt: m.createdAt
      }))
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/groups/:id/logo - upload & resize logo (admin only)
router.post("/:id/logo", auth, upload.single("logo"), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!isAdmin(group, req.user.id)) {
      return res.status(403).json({ message: "Only admin can change logo" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const ext =
      req.file.mimetype === "image/png"
        ? "png"
        : req.file.mimetype === "image/webp"
        ? "webp"
        : "jpg";

    const outputDir = path.join(__dirname, "..", "uploads", "groups");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const fileName = `${group._id}-${Date.now()}.${ext}`;
    const outputPath = path.join(outputDir, fileName);

    await sharp(req.file.path)
      .resize(128, 128, { fit: "cover" })
      .toFormat(ext === "jpg" ? "jpeg" : ext)
      .toFile(outputPath);

    fs.unlink(req.file.path, () => {});

    group.logoUrl = `/uploads/groups/${fileName}`;
    await group.save();

    res.json({ message: "Logo updated", logoUrl: group.logoUrl });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/groups/:id - admin deletes group + messages
router.delete("/:id", auth, async (req, res) => {
  try {
    const groupId = req.params.id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!isAdmin(group, req.user.id)) {
      return res.status(403).json({ message: "Only admin can delete group" });
    }

    await GroupMessage.deleteMany({ group: groupId });
    await Group.findByIdAndDelete(groupId);

    res.json({ message: "Group deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// MEMBERSHIP & ADMIN

// POST /api/groups/:id/join - user requests to join
router.post("/:id/join", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const userId = req.user.id;
    const isMember =
      isAdmin(group, userId) ||
      group.members.some((m) => m.toString() === userId);
    if (isMember) {
      return res.status(400).json({ message: "Already a member" });
    }

    const isPending = group.pendingMembers.some(
      (m) => m.toString() === userId
    );
    if (isPending) {
      return res.status(400).json({ message: "Already requested to join" });
    }

    group.pendingMembers.push(userId);
    await group.save();

    res.json({ message: "Join request sent" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/groups/:id/approve/:userId
router.post("/:id/approve/:userId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!isAdmin(group, req.user.id)) {
      return res.status(403).json({ message: "Only admin can approve" });
    }

    const userId = req.params.userId;
    group.pendingMembers = group.pendingMembers.filter(
      (m) => m.toString() !== userId
    );
    if (!group.members.some((m) => m.toString() === userId)) {
      group.members.push(userId);
    }

    await group.save();
    res.json({ message: "Member approved" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/groups/:id/reject/:userId
router.post("/:id/reject/:userId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!isAdmin(group, req.user.id)) {
      return res.status(403).json({ message: "Only admin can reject" });
    }

    const userId = req.params.userId;
    group.pendingMembers = group.pendingMembers.filter(
      (m) => m.toString() !== userId
    );

    await group.save();
    res.json({ message: "Request rejected" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/groups/:id/add-member/:userId
router.post("/:id/add-member/:userId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!isAdmin(group, req.user.id)) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    const userId = req.params.userId;

    if (!group.members.some((m) => m.toString() === userId)) {
      group.members.push(userId);
    }

    group.pendingMembers = group.pendingMembers.filter(
      (m) => m.toString() !== userId
    );

    await group.save();
    res.json({ message: "Member added" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/groups/:id/remove-member/:userId
router.post("/:id/remove-member/:userId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!isAdmin(group, req.user.id)) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    const userId = req.params.userId;
    if (isAdmin(group, userId)) {
      return res.status(400).json({ message: "Cannot remove admin" });
    }

    group.members = group.members.filter(
      (m) => m.toString() !== userId
    );
    group.pendingMembers = group.pendingMembers.filter(
      (m) => m.toString() !== userId
    );

    await group.save();
    res.json({ message: "Member removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/groups/:id/members - for GroupChatBox
router.get("/:id/members", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("admin", "name email")
      .populate("members", "name email")
      .populate("pendingMembers", "name email")
      .lean();
    if (!group) return res.status(404).json({ message: "Group not found" });

    const userId = req.user.id;
    const isMember =
      group.admin._id.toString() === userId ||
      group.members.some((m) => m._id.toString() === userId);

    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    res.json({
      admin: group.admin,
      members: group.members,
      pendingMembers: group.pendingMembers
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
