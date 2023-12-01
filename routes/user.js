const express = require("express")
const router = express.Router()
const tryCatch = require("../utils/tryCatch")
const upload = require("../middlewares/upload")
const {
  getUserProfile,
  editUserProfile,
  getComments,
  toggleFollow,
  getFollowers,
  getFollowing,
  setUserInterestedTags,
  getUserInterestedTags,
  getReadingList,
  addToReadingList,
  removeFromReadingList,
} = require("../controllers/user");

router.get("/:userId", tryCatch(getUserProfile))

router.put("/:userId",tryCatch(editUserProfile))

router.get("/:userId/comments", tryCatch(getComments))

router.post("/:userId/toggleFollow", tryCatch(toggleFollow))

router.get("/:userId/followers", tryCatch(getFollowers))

router.get("/:userId/following", tryCatch(getFollowing))

router.post("/:userId/interestedTags", tryCatch(setUserInterestedTags))

router.get("/:userId/interestedTags", tryCatch(getUserInterestedTags))

router.get("/:userId/readingList", tryCatch(getReadingList))

router.post("/:userId/readingList", tryCatch(addToReadingList))

router.delete("/:userId/readingList/:readingListId", tryCatch(removeFromReadingList))


module.exports = router