const cloudinary = require('../configure/cloudinary')
const jwt = require('jsonwebtoken')
const Video = require('../models/Video')


// ******************* Upload Video *******************
const upload = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1]
        const tokenData = jwt.verify(token, process.env.SEC_KEY)
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
            videoUrl: uploadedVideo.secure_url,
            videoPublicId: uploadedVideo.public_id,
            thumbnailUrl: uploadedThumbnail.secure_url,
            thumbnailPublicId: uploadedThumbnail.public_id,
            uploadedBy: tokenData._id,
            tags: req.body.tags
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
        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY);

        const data = await Video.find({
            uploadedBy: tokenData._id
        });

        return res.status(200).json({
            Video: data
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: err
        });
    }
}


// ******************* Get Video by ID *******************
const getVideoById = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1]
        const tokenData = jwt.verify(token, process.env.SEC_KEY)

        const videoId = req.params.videoId
        const data = await Video.findById(videoId)
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
        const tokenData = jwt.verify(token, process.env.SEC_KEY)

        const userId = tokenData._id
        console.log(req.params.videoId)

        const video = await Video.findById(req.params.videoId)

        console.log(video)

        if (video.likeUsers.includes(userId)) {
            video.likeUsers = video.likeUsers.filter(userId => userId != userId)
        }
        else {
            if (video.dislikeUsers.includes(userId)) {
                video.dislikeUsers = video.dislikeUsers.filter(userId => userId != userId)
            }
            video.likeUsers.push(userId)
        }
        await video.save()
        res.status(200).json({
            video: video
        })
    }
    catch (err) {
        res.status(500).json({
            error: err.message
        })
    }
}


// ******************* Dislike/Undislike Video *******************
const dislikeUndislike = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY)

        const userId = tokenData._id
        console.log(req.params.videoId)

        const video = await Video.findById(req.params.videoId)

        console.log(video)

        if (video.dislikeUsers.includes(userId)) {
            video.dislikeUsers = video.dislikeUsers.filter(userId => userId != userId)
        }
        else {
            if (video.likeUsers.includes(userId)) {
                video.likeUsers = video.likeUsers.filter(userId => userId != userId)
            }
            video.dislikeUsers.push(userId)
        }
        await video.save()
        res.status(200).json({
            video: video
        })
    }
    catch (err) {
        res.status(500).json({
            error: err.message
        })
    }
}


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
