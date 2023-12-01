const mongoose = require("mongoose")

const userInterestedTag = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    tag: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
        required: true
    }
})

module.exports = mongoose.model("UserInterestedTag", userInterestedTag)