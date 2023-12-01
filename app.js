const express = require("express")
const session = require("express-session")
const MongoDbStore = require("connect-mongodb-session")(session)
const cors = require("cors")
const mongoose = require("mongoose")
require("dotenv").config()
const errorHandler = require("./middlewares/errorHandler")
const AuthRoute = require("./routes/auth")
const PostRoute = require("./routes/post")
const UserRoute = require("./routes/user")

const app = express()

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;
const SESSION_SECRET = process.env.SESSION_SECRET;

app.use(express.json())

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);

const store = new MongoDbStore({
    uri: MONGO_URL,
    collection: "session"
})
const oneDay = 1000 * 60 * 60 * 24
app.use(session({
    secret: SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: oneDay
    },
    store: store
}))

app.use("/api", AuthRoute)
app.use("/api/posts", PostRoute)
app.use("/api/users", UserRoute)

const Tag = require("./models/tag")
app.post("/api/tags", async(req, res) => {
    await Tag.insertMany(req.body.tags)

    res.status(201).json({message: "Inserted Successfully"})
})

app.use(errorHandler)

mongoose.connect(MONGO_URL)
.then(() => {
    console.log("Connected to MongoDb...");
    app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));
})
.catch(error => {
    console.log("Unable to connect to MongoDb...");
    console.log(error);
})


