const { BlobServiceClient } = require('@azure/storage-blob')
const { v4: uuid4 } = require('uuid')
const crypto = require('crypto')
const { PassThrough } = require('stream')
const CONNECTION_STRING =
  'DefaultEndpointsProtocol=https;AccountName=testdevvinu;AccountKey=mImJlnQV0Co/oyYg7MWpVAsISbpB26I68srvkpIxSUBlpN+FpJS8EoY5ZpoiSqSuTqaAeIokenyc+AStTF8uaQ==;EndpointSuffix=core.windows.net'
const CONTAINER_NAME = 'upload-test-container'
const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING)
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME)

exports.upload = async (req, res) => {
  const { fileId, chunkId, filename } = req.body
  const blobName = `uploads/${filename}-${filename}`
  const chunk = req.file.buffer
  const hash = crypto.createHash('md5')
  hash.update(chunk)
  const md5 = Buffer.from(hash.digest('hex'), 'hex')
  console.log('chunk md5: ' + md5.toString())

  console.log(req.file)
  const blockId = Buffer.from(`${filename}-${chunkId}-`.padStart(6, '0')).toString('base64')
  try {
    await containerClient
      .getBlockBlobClient(blobName)
      .stageBlock(blockId, chunk, chunk.length, { transactionalContentMD5: md5 })
    console.log(`Staged ${blockId} successfully`)
    return res.status(200).json({ blockId, md5 })
  } catch (err) {
    console.error(`Error staging block ${blockId}: ${err.message}`)
    return res.status(200).send(`Error staging block ${blockId}: ${err.message}`)
  }
}
exports.commit = async (req, res) => {
  try {
    const { fileId, blockIds, filename, md5s, filetype } = req.body
    console.log('filename: ' + filename)
    const blobName = `uploads/${filename}-${filename}`
    const hash = crypto.createHash('md5')
    const finalHash = Buffer.from(hash.update(md5s.join('')).digest('hex'), 'hex')
    console.log(`Final hash: ${finalHash}`)
    console.log('commiting blocks')
    await containerClient.getBlockBlobClient(blobName).commitBlockList(blockIds, {
      blobHTTPHeaders: { blobContentType: filetype, blobContentMD5: finalHash }
    })
    console.log(`File id ${fileId} committed successfully with filename ${filename}.`)
    console.log(`Committed blocks successfully`)
    res.status(200).send('Blocks committed successfully.')
  } catch (err) {
    console.error(`Error committing blocks: ${err.message}`)
    res.status(500).send(`Error committing blocks: ${err.message}`)
  }
}
