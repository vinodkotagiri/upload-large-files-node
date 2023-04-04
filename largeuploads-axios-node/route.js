const express = require('express')
const router = express.Router()
const { uploadMiddleware } = require('./multer')
const { uploadFiles } = require('./controller2222222222')
const { upload, commit } = require('./controller')
router.get('/', (req, res) => res.send('WORKING'))
// router.put('/upload', uploadFiles)
router.post('/upload', uploadMiddleware, upload)
router.post('/commit', uploadMiddleware, commit)
module.exports = router
