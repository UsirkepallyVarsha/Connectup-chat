const mongoose = require("mongoose");

const { Schema } = mongoose;

const groupSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },

    // creator / admin of group
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // approved members
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],

    // users who requested to join, waiting for admin approval
    pendingMembers: [{ type: Schema.Types.ObjectId, ref: "User" }],

    // logo URL (string URL or relative path)
    logoUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", groupSchema);
