const express = require('express')
const router = express.Router()
const {
    upload,
    getAllVideo,
    getVideoById,
    getMyVideos,
    likeUnlike,
    dislikeUndislike,
    deleteVideo,
    updateVideoDetails
} = require('../controllers/videoController')


router.post('/upload', upload)
router.get('/getAllVideo', getAllVideo)
router.get('/my-videos', getMyVideos)
router.get('/getVideo/:videoId', getVideoById)
router.put('/like/:videoId', likeUnlike)
router.put('/dislike/:videoId', dislikeUndislike)
router.delete('/delete/:videoId', deleteVideo)
router.put('/update/:videoId', updateVideoDetails)

module.exports = router