const express = require("express")
const router = express.Router()
const tryCatch = require("../utils/tryCatch")
const {getTags, createTag} = require("../controllers/tag")

router.get("/", tryCatch(getTags))

router.post("/", tryCatch(createTag))


module.exports = router