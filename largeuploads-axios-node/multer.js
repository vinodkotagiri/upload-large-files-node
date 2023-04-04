const multer = require('multer')
const storage = multer.memoryStorage()
const uploadMiddleware = multer().single('chunk')

module.exports = { uploadMiddleware }
