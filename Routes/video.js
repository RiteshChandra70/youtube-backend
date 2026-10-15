const express = require('express')
const router = express.Router()
const {
    upload,
    getAllVideo,
    getVideoById,
    getMyVideos,
    getVideosByUserId,
    likeUnlike,
    dislikeUndislike,
    deleteVideo,
    updateVideoDetails
} = require('../controllers/videoController')


router.post('/upload', upload)
router.get('/getAllVideo', getAllVideo)
router.get('/getVideo/:videoId', getVideoById)
router.get('/my-videos', getMyVideos)
router.get('/user/:userId', getVideosByUserId)
router.put('/like/:videoId', likeUnlike)
router.put('/dislike/:videoId', dislikeUndislike)
router.delete('/delete/:videoId', deleteVideo)
router.put('/update/:videoId', updateVideoDetails)

module.exports = router