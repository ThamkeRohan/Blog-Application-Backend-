const mongoose = require("mongoose")

const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    }
})

module.exports = mongoose.model("Tag", tagSchema)