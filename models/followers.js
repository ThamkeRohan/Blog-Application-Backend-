const mongoose = require("mongoose")

const followerSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  emailNotficationEnabled: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Follower", followerSchema)