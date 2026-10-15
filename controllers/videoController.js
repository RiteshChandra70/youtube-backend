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

// ******************* Get My Uploaded Videos *******************
const getMyVideos = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Please login first'
            })
        }

        const tokenData = jwt.verify(token, process.env.SEC_KEY)
        const page = Math.max(1, parseInt(req.query.page, 10) || 1)
        const limit = 8
        const filter = { uploadedBy: tokenData._id }

        const [videos, totalVideos] = await Promise.all([
            Video.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('uploadedBy', 'channelName profilePicUrl subscribers'),
            Video.countDocuments(filter)
        ])

        return res.status(200).json({
            success: true,
            videos,
            pagination: {
                currentPage: page,
                totalVideos,
                totalPages: Math.ceil(totalVideos / limit),
                limit
            }
        })
    } catch (err) {
        console.error('Get My Videos Error:', err.message)
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch your videos'
        })
    }
}


// ******************* Get Videos by Channel ID *******************
const getVideosByUserId = async (req, res) => {
    try {
        const { userId } = req.params
        const page = Math.max(1, parseInt(req.query.page, 10) || 1)
        const limit = 8
        const filter = { uploadedBy: userId }

        const [videos, totalVideos] = await Promise.all([
            Video.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('uploadedBy', 'channelName profilePicUrl subscribers'),
            Video.countDocuments(filter)
        ])

        return res.status(200).json({
            success: true,
            videos,
            pagination: {
                currentPage: page,
                totalVideos,
                totalPages: Math.ceil(totalVideos / limit),
                limit
            }
        })
    } catch (err) {
        console.error('Get Videos By User ID Error:', err.message)
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch channel videos'
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

        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({
                message: "Video not found"
            });
        }

        const alreadyLiked = video.likeUsers.some(
            id => id.toString() === userId.toString()
        );

        if (alreadyLiked) {

            // UNLIKE
            video.likeUsers = video.likeUsers.filter(
                id => id.toString() !== userId.toString()
            );

        } else {

            // Remove dislike if already disliked
            video.dislikeUsers = video.dislikeUsers.filter(
                id => id.toString() !== userId.toString()
            );

            // LIKE
            video.likeUsers.push(userId);
        }

        await video.save();

        // IMPORTANT: uploadedBy ko populate karo
        await video.populate(
            'uploadedBy',
            'channelName profilePicUrl subscribers'
        );

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

        const alreadyDisliked = video.dislikeUsers.some(
            id => id.toString() === userId.toString()
        );

        if (alreadyDisliked) {

            // UNDISLIKE
            video.dislikeUsers = video.dislikeUsers.filter(
                id => id.toString() !== userId.toString()
            );

        } else {

            // Remove like if already liked
            video.likeUsers = video.likeUsers.filter(
                id => id.toString() !== userId.toString()
            );

            // DISLIKE
            video.dislikeUsers.push(userId);
        }

        await video.save();

        // IMPORTANT: uploadedBy ko populate karo
        await video.populate(
            'uploadedBy',
            'channelName profilePicUrl subscribers'
        );

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
        const tokenData = jwt.verify(token, process.env.SEC_KEY);

        const videoId = req.params.videoId;
        const video = await Video.findById(videoId);

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
        const token = req.headers.authorization.split(" ")[1];
        const tokenData = jwt.verify(token, process.env.SEC_KEY);

        const videoId = req.params.videoId;
        const video = await Video.findById(videoId);

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



module.exports = {
    upload,
    getAllVideo,
    getVideoById,
    getMyVideos,
    getVideosByUserId,
    likeUnlike,
    dislikeUndislike,
    deleteVideo,
    updateVideoDetails
}

