const createError = require("../utils/createError")
function auth(req, res, next){
    if(req.session && req.session.user){
        return next()
    }
    createError("User is unauthorized to access the resource", 401)
}

module.exports = auth