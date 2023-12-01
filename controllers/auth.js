const bcrypt = require("bcrypt")
const User = require("../models/user")
const createError = require("../utils/createError")

async function login(req, res){
    const {email, password} = req.body
    const user = await User.findOne({email})
    if(user == null){
        createError("Email does not exists", 400)
    }
    const match = await bcrypt.compare(password, user.password)
    if(!match){
        createError("Invalid Password", 400)
    }
    req.session.user = user._id
    res.status(200).json({_id: user._id})
}

async function register(req, res){
    const {name, email, password, profileImage} = req.body
    const user = await User.findOne({email})
    if(user) {
        createError("Email already exists", 400)
    }
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const newUser = new User({
        name,
        email,
        password: hash,
        profileImage
    })
    await newUser.save()
    req.session.user = newUser._id
    res.status(200).json({message: "Registered successfully"})
}

async function logout(req, res){
    req.session.destroy(error => {
        if(error){
            throw error
        }
        res.clearCookie("connect.sid")
        res.status(200).json({message: "Logged out successfully!!"})
    })
}

module.exports = {
    login,
    register,
    logout
}