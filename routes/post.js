const express = require("express")
const router = express.Router()
const tryCatch = require("../utils/tryCatch")
const {
  getAllPosts,
  getPost,
  editPost,
  deletePost,
  createPost,
  togglePostLike,
  createComment,
  getComment,
  editComment,
  deleteComment,
  toggleCommentLike,
  getRelevantPosts,
} = require("../controllers/post");
const upload = require("../middlewares/upload")

router.get("/", tryCatch(getAllPosts))

router.get("/:id", tryCatch(getPost))

router.post("/", upload.single("bannerImage"), tryCatch(createPost))

router.patch("/:id", upload.single("bannerImage"), tryCatch(editPost))

router.delete("/:id", tryCatch(deletePost))

router.post("/:id/toggleLike", tryCatch(togglePostLike))

router.post("/:postId/comments", tryCatch(createComment))

router.get("/:postId/comments", tryCatch(getComment))

router.patch("/:postId/comments/:commentId", tryCatch(editComment))

router.delete("/:postId/comments/:commentId", tryCatch(deleteComment))

router.post("/:postId/comments/:commentId/toggleLike", tryCatch(toggleCommentLike))

router.get("/relevent/:userId", tryCatch(getRelevantPosts))

module.exports = router