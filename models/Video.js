const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
{
    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        default: ""
    },

    videoUrl: {
        type: String,
        required: true
    },

    videoPublicId: {
        type: String,
        required: true
    },

    thumbnailUrl: {
        type: String,
        default: ""
    },

    thumbnailPublicId: {
        type: String,
        default: ""
    },

    views: {
        type: Number,
        default: 0
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    likeUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    dislikeUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    tags: [{
        type: String,
        default: []
    }]

},
{
    timestamps: true
});

module.exports = mongoose.model("Video", videoSchema);