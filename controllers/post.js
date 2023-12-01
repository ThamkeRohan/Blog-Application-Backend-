const mongoose = require("mongoose")
const Post = require("../models/post")
const PostLike = require("../models/postLike")
const Comment = require("../models/comment")
const CommentLike = require("../models/commentLike")
const Follower = require("../models/followers")
const UserInterestedTag = require("../models/userInterestedTag")
const createError = require("../utils/createError")


async function createPost(req, res){
    const post = req.body
    const bannerImageUrl = req.file.filename
    const newPost = new Post({
        ...post,
        body: JSON.parse(post.body),
        bannerImageUrl
    })
    await newPost.save()
    res.status(201).json(newPost) 
}

async function getAllPosts(req, res){
    const filter = {}
    const {sortBy, sortOrder} = req.query
    if(sortBy != null && sortBy != "" && sortOrder != null && sortOrder != "") {
      filter[sortBy] = sortOrder
      
    }
    const posts = await Post.find(filter)
    res.status(200).json({posts})
}

async function getRelevantPosts(req, res) {
  let followedUsers = await Follower.find({ follower: new mongoose.Types.ObjectId(req.params.userId) })
  followedUsers = followedUsers.map(followedUser => followedUser.following)

  let interestedTags = await UserInterestedTag.find({ user: new mongoose.Types.ObjectId(req.params.userId) })
  interestedTags = interestedTags.map(interestedTag => interestedTag.tag)
  const { sortBy, sortOrder } = req.query

  const posts = await Post.aggregate([
    {
      $lookup: {
        from: "posttags",
        localField: "_id",
        foreignField: "post",
        as: "postTagRelation"
      }
    },
    {
      $addFields: {
        tags: {
          $map: {
            input: "$postTagRelation",
            as: "x",
            in: "$$x.tag"
          }
        }
      }
    }, 
    {
      $match: {
        $or: [
          { user: { $in: followedUsers } },
          { tags: { $in: interestedTags } }
        ]
      }
    }, 
    {
      $sort: {
        [sortBy]: [sortOrder]
      }
    }
  ])
}

async function getPost(req, res){
    const [post] = await Post.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $lookup: {
          from: "postlikes",
          localField: "_id",
          foreignField: "post",
          as: "postLikes",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: "$author",
      },
      {
        $project: {
          title: true,
          bannerImageUrl: true,
          description: true,
          body: true,
          createdAt: true,
          updatedAt: true,
          likeCount: { $size: "$postLikes" },
          likedByMe: {
            $in: [
              new mongoose.Types.ObjectId(req.session.user),
              {
                $map: {
                  input: "$postLikes",
                  as: "postLike",
                  in: "$$postLike.likedBy",
                },
              },
            ],
          },
          author: {
            _id: "$author._id",
            name: "$author.name",
            profileImageUrl: "$author.profileImageUrl",
            bio: "$author.bio",
            createdAt: "$author.createdAt"
          },
        },
      },
    ]);

    const comments = await Comment.aggregate([
      {
        $match: {
          post: post._id,
        },
      },
      {
        $lookup: {
          from: "commentlikes",
          localField: "_id",
          foreignField: "comment",
          as: "commentLikes",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "madeBy",
          foreignField: "_id",
          as: "madeBy",
        },
      },
      {
        $unwind: "$madeBy",
      },
      {
        $project: {
          body: true,
          parent: true,
          createdAt: true,
          updatedAt: true,
          madeBy: {
            _id: "$madeBy._id",
            name: "$madeBy.name"
          },
          likeCount: {
            $size: "$commentLikes",
          },
          likedByMe: {
            $in: [
              new mongoose.Types.ObjectId(req.session.user),
              {
                $map: {
                  input: "$commentLikes",
                  as: "commentLike",
                  in: "$$commentLike.likedBy",
                },
              },
            ],
          },
        },
      },
      {
        $sort: {
            createdAt: -1
        }
      }
    ]);
    
    post.comments = comments
    res.status(200).json(post)
}

async function editPost(req, res){
    const id = req.params.id
    const post = await Post.findById(id)
    if(post == null){
        createError(`Cannot update post as the post with the id: "${id}" does not exists`, 404)
    }
    if(!post.author.equals(req.session.user)){
        createError(`You do not have permission to edit this post`)
    }
    post.title = req.body.title
    post.description = req.body.description
    post.body = JSON.parse(req.body.body)
    if(req.file != null){
        post.bannerImageUrl = req.file.filename
    }
    await post.save()
    res.status(201).json(post)
}

async function deletePost(req, res){
    const post = await Post.findById(req.params.id)
    if(post == null){
        createError(`Cannot delete post as the post with the id: "${req.params.id}" does not exists`, 404)
    }
    if(!post.author.equals(req.session.user)){
        createError(`You do not have permission to delete this post`)
    }
    await Post.findByIdAndDelete(req.params.id)
    res.status(200).json({_id: req.params.id})
}

async function togglePostLike(req, res){
    const postId = req.params.id
    const user = req.session.user
    const post = await Post.findById(postId)
    if(post == null){
        createError(`Cannot like or dislike post as post with id: "${postId}" does not exists`, 404)
    }
    if(post.author.equals(user)){
        createError("You cannot like or dislike your own post", 403)
    }
    const liked = await PostLike.findOne({
        post: new mongoose.Types.ObjectId(postId),
        likedBy: new mongoose.Types.ObjectId(user)
    })
    if(liked == null){
        await PostLike.create({
        post: new mongoose.Types.ObjectId(postId),
        likedBy: new mongoose.Types.ObjectId(user)
    })
    return res.status(201).json({likedByMe: true})
    }
    else{
        await PostLike.findByIdAndDelete(liked._id)
        return res.status(200).json({likedByMe: false})
    }
}

async function createComment(req, res){
    const comment = new Comment({
        ...req.body,
        post: req.params.postId,
        madeBy: req.session.user
    })
    await comment.save()
    comment.likeCount = 0
    comment.likedByMe = false
    res.status(201).json(comment) 
}

async function getComment(req, res) {
    const comment = await Comment.findById(req.params.commentId)
      .populate({
        path: "parent",
        model: "Comment",
        select: "body",
      })
      .populate({
        path: "post",
        model: "Post",
        select: "title",
      })
      .populate({
        path: "user",
        model: "User",
        select: "name profileImageUrl",
      });
    const likeCount = await CommentLike.countDocuments({comment: comment._id})
    comment.likeCount = likeCount
    res.status(200).json(comment)
}

async function editComment(req, res){
    const commentId = req.params.commentId
    const comment = await Comment.findById(commentId)
    if(comment == null){
        createError(`Cannot edit comment as the comment with id: "${commentId}" does not exits`, 404)
    }
    if(!comment.madeBy.equals(req.session.user)){
        createError("You do not have permission to edit the comment", 403)
    }
    comment.body = req.body.body
    await comment.save()
    res.status(201).json(comment)
}

async function deleteComment(req, res){
    const commentId = req.params.commentId
    const comment = await Comment.findById(commentId)
    if(comment == null){
        createError(`Cannot delete comment as the comment with id: "${commentId}" does not exits`, 404)
    }
    if(!comment.madeBy.equals(req.session.user)){
        createError("You do not have permission to delete the comment", 403)
    }
    await Comment.findByIdAndDelete(commentId)
    res.status(200).json({_id: commentId})
}

async function toggleCommentLike(req, res){
    const commentId = req.params.commentId
    const comment = await Comment.findById(commentId)
    const user = req.session.user
    if(comment == null){
        createError(`Cannot like or dislike comment as the comment with id: "${commentId}" does not exits`, 404)
    }
    if(comment.madeBy.equals(user)){
        createError("You cannot like your own comment", 403)
    }
    const liked = await CommentLike.findOne({
        comment: new mongoose.Types.ObjectId(commentId),
        likedBy: new mongoose.Types.ObjectId(user)
    })
    if(liked == null){
        await CommentLike.create({
          comment: new mongoose.Types.ObjectId(commentId),
          likedBy: new mongoose.Types.ObjectId(user),
        })
        return res.status(201).json({likedByMe: true})
    }
    else{
        await CommentLike.findByIdAndDelete(liked._id)
        return res.status(200).json({likedByMe: false})
    }
}


module.exports = {
    getAllPosts,
    getRelevantPosts,
    getPost,
    editPost,
    deletePost,
    createPost,
    getComment,
    togglePostLike,
    createComment,
    editComment,
    deleteComment,
    toggleCommentLike
}