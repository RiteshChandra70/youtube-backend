const Comment = require('../models/Comment')
const jwt = require("jsonwebtoken")
const Video = require("../models/Video")


// ******************* Add Comment *******************
const addComment = async (req, res) => {
    try {

        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY);

        console.log(tokenData)

        const { comment } = req.body
        const { videoId } = req.params

        if (!comment || !videoId) {
            return res.status(400).json({
                message: "Comment and Video Id are required"
            });
        }

        const data = await Comment.create({
            commentBy: tokenData._id,
            comment,
            videoId
        })

        return res.status(201).json({
            message: "Comment added successfully",
            Comment: data
        })

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: err.message
        })
    }
}


// ******************* Edit Comment *******************
const editComment = async (req, res) => {
    try {

        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY)

        const comment = await Comment.findById(req.params.commentId)

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            })
        }
        else if (comment.commentBy.toString() !== tokenData._id) {
            return res.status(403).json({
                message: "You are not authorized to edit this comment"
            })
        }
        else {
            const updatedComment = await Comment.findByIdAndUpdate(req.params.commentId, { comment: req.body.comment }, { new: true })
            return res.status(200).json({
                message: "Comment updated successfully",
                Comment: updatedComment
            })
        }

    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
}


// ******************* Like/Unlike Comment *******************
const likeUnlike = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY)

        const comment = await Comment.findById(req.params.commentId)

        if (comment.likeBy.includes(tokenData._id)) {
            comment.likeBy = comment.likeBy.filter(userId => userId != tokenData._id)
        }
        else {
            if (comment.dislikeBy.includes(tokenData._id)) {
                comment.dislikeBy = comment.dislikeBy.filter(userId => userId != tokenData._id)
            }
            comment.likeBy.push(tokenData._id)
        }
        await comment.save()
        res.status(200).json({
            comment: comment
        })

    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
}


// ******************* Dislike/Undislike Comment *******************
const dislikeUndislike = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY)

        const comment = await Comment.findById(req.params.commentId)

        if (comment.dislikeBy.includes(tokenData._id)) {
            comment.dislikeBy = comment.dislikeBy.filter(userId => userId != tokenData._id)
        }
        else {
            if (comment.likeBy.includes(tokenData._id)) {
                comment.likeBy = comment.likeBy.filter(userId => userId != tokenData._id)
            }
            comment.dislikeBy.push(tokenData._id)
        }
        await comment.save()
        res.status(200).json({
            comment: comment
        })

    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
}


// ******************* Delete Comment *******************  
const deleteComment = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY)

        const comment = await Comment.findById(req.params.commentId)
        const video = await Video.findById(comment.videoId)

        if (comment.commentBy.toString() !== tokenData._id && video.uploadedBy.toString() !== tokenData.userId) {
            return res.status(403).json({
                message: "You are not authorized to delete this comment"
            })
        }
        else {
            const data = await Comment.findByIdAndDelete(req.params.commentId)
            return res.status(200).json({
                message: "Comment deleted successfully"
            })
        }
    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
}


module.exports = { addComment, editComment, deleteComment, likeUnlike, dislikeUndislike }