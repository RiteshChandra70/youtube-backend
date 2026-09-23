const express = require('express')
const router = express.Router()
const { addComment,
    editComment,
    deleteComment,
    likeUnlike,
    dislikeUndislike,
    getComment,
    getAllComment
} = require('../controllers/commentController')

router.post('/addComment/:videoId', addComment)
router.get('/:commentId', getComment)
router.get('/video/:videoId', getAllComment)
router.put('/:commentId', editComment)
router.delete('/:commentId', deleteComment)
router.put('/likeUnlike/:commentId', likeUnlike)
router.put('/dislikeUndislike/:commentId', dislikeUndislike)

module.exports = router