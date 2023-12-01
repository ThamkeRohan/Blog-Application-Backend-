const express = require("express")
const router= express.Router()
const {login, register, logout} = require("../controllers/auth")
const tryCatch = require("../utils/tryCatch")

router.post("/login", tryCatch(login))

router.post("/register", tryCatch(register))

router.get("/logout", tryCatch(logout))

module.exports = router