const mongoose = require("mongoose")

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    bannerImageUrl: {
      type: String,
      required: true,
    },

    body: [
      {
        id: String,
        content: String,
        contentType: {
          type: String,
          enum: ["TEXT", "IMAGE", "MAIN_HEADING"],
        },
        formatting: {
          type: {
            BOLD: Boolean,
            ITALIC: Boolean,
            LINK: Boolean,
            TITLE: Boolean,
            SUBTITLE: Boolean,
            BORDER: Boolean,
          },
          default: {
            BOLD: false,
            ITALIC: false,
            LINK: false,
            TITLE: false,
            SUBTITLE: false,
            BORDER: false,
          },
        },
      },
    ],

    description: {
      type: String,
      required: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);


module.exports = mongoose.model("Post", postSchema)