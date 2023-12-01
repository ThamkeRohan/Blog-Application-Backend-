const mongoose = require("mongoose")
const User = require("../models/user")
const UserInterestedTag = require("../models/userInterestedTag")
const Follower = require("../models/followers")
const Comment = require("../models/comment")
const ReadingList = require("../models/readingList")
const createError = require("../utils/createError")

async function getUserProfile(req, res) {
    const [user] = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.params.userId)
            }
        },
        {
            $lookup: {
                from: "posts",
                localField: "_id",
                foreignField: "author",
                as: "posts"
            }
        },
        {
            $addFields: {
                sortedPosts: {
                    $sortArray: {
                        input: "$posts",
                        sortBy: {createdAt: -1}
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                profileImageUrl: 1,
                bio: 1,
                posts: {
                    $map: {
                        input: "$sortedPosts",
                        as: "post",
                        in: {
                            _id: "$$post._id",
                            bannerImageUrl: "$$post.bannerImageUrl",
                            title: "$$post.title",
                            description: "$$post.description"
                        }
                    }
                }
            }
        }
    ])
    
    res.status(200).json(user)
}

async function editUserProfile(req, res) {
    if(!req.session.user.equals(new mongoose.Types.ObjectId(req.params.userId))){
        createError("You do not have permission to edit the profile of this user", 403)
    }
    const user = await User.findById(req.session.user)
    user.name = req.body.name
    user.bio = req.body.bio
    user.profileImageUrl = req.body.profileImageUrl
    await user.save()
    res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl
    })
}

async function getComments(req, res) {
    const comments = await Comment.find({
        madeBy: new mongoose.Types.ObjectId(req.params.userId)
    })
    .populate({
        path: "post",
        model: "Post",
        select: "title"
    })
    .sort({createdAt: -1})
    .select("body createdAt post")
    res.status(200).json(comments)
}

async function toggleFollow(req, res) {
    const follow = await Follower.findOne({
        follower: new mongoose.Types.ObjectId(req.session.user),
        following: new mongoose.Types.ObjectId(req.params.userId)
    })
    if(follow == null){
        await Follower.create({
        follower: new mongoose.Types.ObjectId(req.session.user),
        following: new mongoose.Types.ObjectId(req.params.userId)
        })
        res.status(201).json({following: true})
    }
    else{
        await Follower.findByIdAndDelete(follow._id)
        res.status(200).json({following: false})
    }
}


async function getFollowers(req, res) {
    let followers = await Follower.find({ following: new mongoose.Types.ObjectId(req.params.userId)})
    .populate({
        path: 'follower',
        model: 'User',
        select: 'name email profileImageUrl',
    })
    
    followers = followers.map(follower => follower.follower)
    res.status(200).json(followers)
}

async function getFollowing(req, res) {
    let followingUsers = await Follower.find({
        follower: new mongoose.Types.ObjectId(req.params.userId)
    })
    .populate({
        path: 'following',
        model: 'User',
        select: '-password'
    })
    followingUsers = followingUsers.map(followingUser => followingUser.following)
    res.status(200).json(followingUsers) 
}

async function setUserInterestedTags(req, res) {
    if(!req.session.user.equals(new mongoose.Types.ObjectId(req.params.userId))){
        createError("You do not have permission to set tags for this user", 403)
    }
    const userInterestedTags = req.body.userInterestedTags.map(userInterestedTag => ({
        user: req.session.user,
        tag: userInterestedTag
    }))
    await UserInterestedTag.insertMany(userInterestedTags)
    res.status(201).json({message: "Tags set successfully"})
}

async function getUserInterestedTags(req, res) {
    let  userInterestedTags = await UserInterestedTag.find({
        user: new mongoose.Types.ObjectId(req.params.userId)      
    })
    .populate("tag")
    userInterestedTags = userInterestedTags.map(userInterestedTag => userInterestedTag.tag)
    res.status(200).json(userInterestedTags)
}

async function addToReadingList(req, res) {
    if(!req.sessio.user.equals(new mongoose.Types.ObjectId(req.params.userId))) {
        createError("You do not have permission to add post to reading list for this user", 403)
    }
    await ReadingList.create({
        user: req.session.user,
        post: new mongoose.Types.ObjectId(req.body.post)
    })
    res.status(201).json({ message: "Added to reading list" })
}

async function removeFromReadingList(req, res) {
    if(!req.sessio.user.equals(new mongoose.Types.ObjectId(req.params.userId))) {
        createError("You do not have permission to add post to reading list for this user", 403)
    }
    const readingList = await ReadingList.findByIdAndDelete(req.params.readingListId)
    if(readingList == null){
        createError("Cannot delete as the given reading list does not exists", 404)
    }
    res.status(200).json({ _id: readingList._id })
}

async function getReadingList(req, res) {
    if(!req.session.user.equals(new mongoose.Types.ObjectId(req.params.userId))) {
        createError("You do not have permission to see reading list of this user", 403)
    }
    const {posts} = await ReadingList.aggregate([
        {
            $match: {
                user: req.session.user
            }
        },
        {
            $lookup: {
                from: "posts",
                localField: "post",
                foreignField: "_id",
                as: "post"
            }
        },
        {
            $unwind: "$post"
        },
        {
            $lookup: {
                from: "users",
                localField: "post.user",
                foreignField: "_id",
                as: "post.user"
            }
        },
        {
            $unwind: "$post.user"
        },
        
    ])
    res.status(200).json(posts)
}


module.exports = {
  getUserProfile,
  editUserProfile,
  getComments,
  toggleFollow,
  getFollowers,
  getFollowing,
  getUserInterestedTags,
  setUserInterestedTags,
  addToReadingList,
  removeFromReadingList,
  getReadingList
};
