const Tag = require("../models/tag")
const createError = require("../utils/createError")

async function getTags(req, res) {
    const tags = await Tag.aggregate([
        {
            $lookup: {
                from: "posttags",
                localField: "_id",
                foreignField: "tag",
                as: "postTagRelation"
            },
        },
        {
            $project: {
                _id: 1,
                name: 1,
                postCount: {
                    $size: "$postTagRelation"
                }
            }
        }
    ])
    res.status(200).json(tags)
}

async function createTag(req, res) {
    const exists = await Tag.find({ name: req.body.name })
    if(exists) {
        createError("Cannot create tag as it already exists", 400)
    }
    const tag = await Tag.create({ name: req.body.name })
    res.status(201).json(tag)
}

module.exports = {
    getTags,
    createTag
}