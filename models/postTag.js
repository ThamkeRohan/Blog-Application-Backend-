const mongoose = require("mongoose")

const postTagSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    tag: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
        required: true
    }
})

module.exports = mongoose.model("PostTag", postTagSchema)