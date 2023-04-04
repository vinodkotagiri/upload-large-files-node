import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_URL = 'http://localhost:3000/upload'
const COMMIT_URL = 'http://localhost:3000/commit'

export const uploadFile = async (file) => {
  const chunkSize = 4 * 1024 * 1024 // 4 MB chunks
  const totalChunks = Math.ceil(file.size / chunkSize)
  let uploadedChunks = 0
  const blockIds = []
  const md5s = []
  const fileId = uuidv4() // generate a unique ID for this file

  const filename = file.name
  const filetype = file.type
  console.log(file)
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)
    const blob = new Blob([chunk])
    console.log(chunk)
    const formData = new FormData()
    formData.append('fileId', fileId)
    formData.append('filename', filename)
    formData.append('fileContentType', filetype)
    formData.append('chunkId', i + 1)
    formData.append('chunk', blob)

    try {
      const res = await axios.post(UPLOAD_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (!res.data) {
        console.error(`Error uploading chunk ${i + 1}: no response data`)
        return
      }

      blockIds.push(res.data.blockId)
      md5s.push(res.data.md5)
      uploadedChunks++
      console.log(`Chunk ${i + 1} uploaded successfully.`)
    } catch (err) {
      console.error(`Error uploading chunk ${i + 1}: ${err.message}`)
      return
    }
  }

  try {
    const res = await axios.post(COMMIT_URL, {
      fileId,
      blockIds,
      md5s,
      filename,
      filetype
    })

    if (!res.data) {
      console.error(`Error committing blocks: no response data`)
      return
    }

    console.log('File uploaded successfully.')
  } catch (err) {
    console.error(`Error committing blocks: ${err.message}`)
  }
}
