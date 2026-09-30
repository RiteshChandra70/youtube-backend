const cloudinary = require('../configure/cloudinary')
const jwt = require('jsonwebtoken')
const Video = require('../models/Video')


// ******************* Upload Video *******************
const upload = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1]
        const tokenData = jwt.verify(token, process.env.SEC_KEY)

        console.log("TOKEN DATA:", tokenData)
        console.log(req.files)
        const uploadedVideo = await cloudinary.uploader.upload(req.files.video.tempFilePath, {
            resource_type: 'video',
            folder: 'sbstube/video'
        })

        const uploadedThumbnail = await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath, {
            resource_type: 'image',
            folder: 'sbstube/thumbnail'
        })

        const newVideo = new Video({
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            videoUrl: uploadedVideo.secure_url,
            videoPublicId: uploadedVideo.public_id,
            thumbnailUrl: uploadedThumbnail.secure_url,
            thumbnailPublicId: uploadedThumbnail.public_id,
            uploadedBy: tokenData._id,
            tags: JSON.parse(req.body.tags).map(tag => tag.trim()).filter(tag => tag.length > 0)
        })

        const newUploadedVideo = await newVideo.save()
        res.status(200).json({
            newVideo: newUploadedVideo
        })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
}


// ******************* Get All Videos *******************
const getAllVideo = async (req, res) => {
    try {
        const data = await Video.find().populate('uploadedBy', 'channelName profilePicUrl subscribers')

        return res.status(200).json({
            Video: data
        })

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            error: err.message
        })
    }
}


// ******************* Get Video by ID *******************
const getVideoById = async (req, res) => {
    try {

        const videoId = req.params.videoId
        const data = await Video.findById(videoId).populate('uploadedBy', 'channelName profilePicUrl subscribers')
        if (!data) {
            return res.status(404).json({
                message: "Video not found"
            });
        }

        data.views += 1
        await data.save()

        return res.status(200).json({
            Video: data
        })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
}


// ******************* Like/Unlike Video *******************
const likeUnlike = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY);

        const userId = tokenData._id;
        const videoId = req.params.videoId;

        console.log("VIDEO ID:", videoId);
        console.log("USER ID:", userId);

        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({
                message: "Video not found"
            });
        }

        // Check if user already liked
        const alreadyLiked = video.likeUsers.some(
            id => id.toString() === userId.toString()
        );

        if (alreadyLiked) {

            // UNLIKE
            video.likeUsers = video.likeUsers.filter(
                id => id.toString() !== userId.toString()
            );

        } else {

            // If user disliked before, remove dislike
            video.dislikeUsers = video.dislikeUsers.filter(
                id => id.toString() !== userId.toString()
            );

            // LIKE
            video.likeUsers.push(userId);
        }

        await video.save();

        res.status(200).json({
            message: alreadyLiked ? "Video unliked" : "Video liked",
            video: video
        });

    } catch (err) {
        console.log(err);

        res.status(500).json({
            error: err.message
        });
    }
};


// ******************* Dislike/Undislike Video *******************
const dislikeUndislike = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY);

        const userId = tokenData._id;
        const videoId = req.params.videoId;

        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({
                message: "Video not found"
            });
        }

        // Check if user already disliked
        const alreadyDisliked = video.dislikeUsers.some(
            id => id.toString() === userId.toString()
        );

        if (alreadyDisliked) {

            // UNDISLIKE
            video.dislikeUsers = video.dislikeUsers.filter(
                id => id.toString() !== userId.toString()
            );

        } else {

            // If user liked before, remove like
            video.likeUsers = video.likeUsers.filter(
                id => id.toString() !== userId.toString()
            );

            // DISLIKE
            video.dislikeUsers.push(userId);
        }

        await video.save();

        res.status(200).json({
            message: alreadyDisliked ? "Video undisliked" : "Video disliked",
            video: video
        });

    } catch (err) {
        console.log(err);

        res.status(500).json({
            error: err.message
        });
    }
};


// ******************* Update Video Details *******************
const updateVideoDetails = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY)

        const videoId = req.params.videoId
        const video = await Video.findById(videoId)

        const newVideoDetails = new Video({
            title: req.body.title || video.title,
            description: req.body.description || video.description
        })

        const updatedVideo = await Video.findByIdAndUpdate(videoId, newVideoDetails, { new: true })
        res.status(200).json({
            video: updatedVideo
        })
    }
    catch (err) {
        res.status(500).json({
            error: err.message
        })
    }
}


// ******************* Delete Video *******************
const deleteVideo = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1]
        const tokenData = jwt.verify(token, process.env.SEC_KEY)

        const videoId = req.params.videoId
        const video = await Video.findById(videoId)

        if (!video) {
            return res.status(404).json({
                message: "Video not found"
            });
        }

        await cloudinary.uploader.destroy(video.videoPublicId, { resource_type: 'video' })
        await cloudinary.uploader.destroy(video.thumbnailPublicId, { resource_type: 'image' })

        await Video.findByIdAndDelete(videoId)

        res.status(200).json({
            message: "Video deleted successfully"
        })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
}


module.exports = { upload, getAllVideo, getVideoById, likeUnlike, dislikeUndislike, deleteVideo, updateVideoDetails }
