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


// ******************* Get Comment *******************
const getComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId)

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            })
        }

        return res.status(200).json({
            Comment: comment
        })

    } catch (err) {
        console.log(err)

        res.status(500).json({
            error: err
        })
    }
}


// ******************* Get All Comments of Video *******************
const getAllComment = async (req, res) => {
    try {

        const token = req.headers.authorization?.split(" ")[1];

        let userId = null;

        if (token) {
            const tokenData = jwt.verify(token, process.env.SEC_KEY);
            userId = tokenData._id.toString();
        }

        const comments = await Comment.find({
            videoId: req.params.videoId
        })
        .populate("commentBy", "channelName profilePicUrl");

        const commentsData = comments.map(comment => {

            const isLike = userId
                ? comment.likeBy.some(
                    id => id.toString() === userId
                )
                : false;

            const isDislike = userId
                ? comment.dislikeBy.some(
                    id => id.toString() === userId
                )
                : false;

            return {
                _id: comment._id,
                comment: comment.comment,
                commentBy: comment.commentBy,
                createdAt: comment.createdAt,

                likeCount: comment.likeBy.length,
                dislikeCount: comment.dislikeBy.length,

                isLike: isLike,
                isDislike: isDislike
            };
        });

        return res.status(200).json({
            comments: commentsData
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            error: err.message
        });
    }
}

// ******************* Edit Comment *******************
const editComment = async (req, res) => {
    try {

        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const tokenData = jwt.verify(token, process.env.SEC_KEY);

        const comment = await Comment.findById(req.params.commentId);

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
        const tokenData = jwt.verify(token, process.env.SEC_KEY);

        const userId = tokenData._id.toString();

        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        const alreadyLiked = comment.likeBy.some(
            id => id.toString() === userId
        );

        if (alreadyLiked) {

            comment.likeBy = comment.likeBy.filter(
                id => id.toString() !== userId
            );

        } else {

            comment.dislikeBy = comment.dislikeBy.filter(
                id => id.toString() !== userId
            );

            comment.likeBy.push(userId);
        }

        await comment.save();

        return res.status(200).json({
            message: alreadyLiked
                ? "Comment unliked"
                : "Comment liked",

            comment: {
                _id: comment._id,
                likeCount: comment.likeBy.length,
                dislikeCount: comment.dislikeBy.length,
                isLike: !alreadyLiked,
                isDislike: false
            }
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            error: err.message
        });
    }
}


// ******************* Dislike/Undislike Comment *******************
const dislikeUndislike = async (req, res) => {
    try {

        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY);

        const userId = tokenData._id.toString();

        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        const alreadyDisliked = comment.dislikeBy.some(
            id => id.toString() === userId
        );

        if (alreadyDisliked) {

            comment.dislikeBy = comment.dislikeBy.filter(
                id => id.toString() !== userId
            );

        } else {

            comment.likeBy = comment.likeBy.filter(
                id => id.toString() !== userId
            );

            comment.dislikeBy.push(userId);
        }

        await comment.save();

        return res.status(200).json({
            message: alreadyDisliked
                ? "Comment undisliked"
                : "Comment disliked",

            comment: {
                _id: comment._id,
                likeCount: comment.likeBy.length,
                dislikeCount: comment.dislikeBy.length,
                isLike: false,
                isDislike: !alreadyDisliked
            }
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            error: err.message
        });
    }
}


module.exports = { addComment, editComment, deleteComment, likeUnlike, dislikeUndislike, getComment, getAllComment }