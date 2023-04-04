const { BlobServiceClient } = require('@azure/storage-blob')
const crypto = require('crypto')
const { PassThrough, pipeline } = require('stream')
const fs = require('fs')
const stream = require('stream')
const util = require('util')

const CONNECTION_STRING =
  'DefaultEndpointsProtocol=https;AccountName=testdevvinu;AccountKey=mImJlnQV0Co/oyYg7MWpVAsISbpB26I68srvkpIxSUBlpN+FpJS8EoY5ZpoiSqSuTqaAeIokenyc+AStTF8uaQ==;EndpointSuffix=core.windows.net'
const CONTAINER_NAME = 'upload-test-container'
const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING)
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME)

async function uploadFiles(req, res) {
  console.log('controller called')
  try {
    const rangeHeader = req.headers['content-range']
    const fileSize = parseInt(rangeHeader.split('/')[1])

    const [start, end] = rangeHeader.split(' ')[1].split('-').map(Number)

    const fileDetails = req.headers['x-file-details'] || []
    const { originalname, encoding, mimetype } = JSON.parse(fileDetails)

    const blobName = `data/${originalname}`
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)

    console.log('blob name: ' + blobName)

    const hash = crypto.createHash('md5')
    const passThrough = new PassThrough({ highWaterMark: 1024 * 1024 })
    let size = 0
    req.on('data', (data) => {
      hash.update(data)
      passThrough.write(data)
    })
    let finalHash

    req.on('end', () => {
      finalHash = Buffer.from(hash.digest('md5'), 'base64')
      passThrough.end()
      console.log('final hash: ' + JSON.stringify(finalHash))
    })
    let uploadedBytes = 0
    const progressCallback = (p) => {
      const deltaBytes = p.loadedBytes - uploadedBytes
      uploadedBytes = p.loadedBytes
      const endTime = new Date().getTime()
      const duration = (endTime - startTime) / 1000 // convert to seconds
      const logMessage = `Uploaded ${p.loadedBytes} bytes in ${duration} seconds    (delta ${deltaBytes})\n`
      fs.appendFileSync('upload.log', logMessage)
      console.log(logMessage)
    }
    const startTime = new Date().getTime()
    blockBlobClient
      .uploadStream(passThrough, 1024 * 1024, undefined, {
        blobHTTPHeaders: { blobContentType: mimetype, blobContentMD5: finalHash, contentLength: fileSize.toString() },
        onProgress: progressCallback
      })
      .then((response) => {
        const endTime = new Date().getTime()
        const duration = (endTime - startTime) / 1000
        console.log(`Uploaded ${fileSize} bytes in ${duration} seconds`)
        fs.appendFileSync('upload.log', `Uploaded ${fileSize} bytes in ${duration} seconds`)
        console.log('response: ' + JSON.stringify(response))
        res.status(200).json({ url: blockBlobClient.url })
      })
      .catch((error) => {
        console.log(error)
        res.status(500).send()
      })
  } catch (error) {
    console.log(error)
    res.status(500).send()
  }
}

module.exports = { uploadFiles }
