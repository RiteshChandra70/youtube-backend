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
        const userId = tokenData._id.toString();

        const { comment: newText } = req.body;

        if (!newText || !newText.trim()) {
            return res.status(400).json({
                message: "Comment cannot be empty"
            });
        }

        if (newText.length > 1000) {
            return res.status(400).json({
                message: "Comment cannot exceed 1000 characters"
            });
        }

        const existingComment = await Comment.findById(
            req.params.commentId
        );

        if (!existingComment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        if (existingComment.commentBy.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to edit this comment"
            });
        }

        existingComment.comment = newText.trim();
        await existingComment.save();

        return res.status(200).json({
            message: "Comment updated successfully",
            comment: {
                _id: existingComment._id,
                comment: existingComment.comment,
                updatedAt: existingComment.updatedAt
            }
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: err.message
        });
    }
};


 // ******************* Delete Comment *******************
const deleteComment = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const tokenData = jwt.verify(token, process.env.SEC_KEY);
        const userId = tokenData._id.toString();

        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        const video = await Video.findById(comment.videoId);

        if (!video) {
            return res.status(404).json({
                message: "Video not found"
            });
        }

        const isCommentOwner =
            comment.commentBy.toString() === userId;

        const isVideoOwner =
            video.uploadedBy.toString() === userId;

        if (!isCommentOwner && !isVideoOwner) {
            return res.status(403).json({
                message: "You are not authorized to delete this comment"
            });
        }

        await Comment.findByIdAndDelete(req.params.commentId);

        return res.status(200).json({
            message: "Comment deleted successfully"
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            error: err.message
        });
    }
};


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