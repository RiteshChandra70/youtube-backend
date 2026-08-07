const express = require('express')
const router = express.Router()
const { addComment,
    editComment,
    deleteComment,
    likeUnlike,
    dislikeUndislike
} = require('../controllers/commentController')

router.post('/addComment/:videoId', addComment)
router.put('/:commentId', editComment)
router.delete('/:commentId', deleteComment)
router.put('/likeUnlike/:commentId', likeUnlike)
router.put('/dislikeUndislike/:commentId', dislikeUndislike)

module.exports = router