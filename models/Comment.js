const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
    commentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    },

    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: true
    },

    likeBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    dislikeBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
},
    {
        timestamps: true
    });

module.exports = mongoose.model("Comment", commentSchema);
