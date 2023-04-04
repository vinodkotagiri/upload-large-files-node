import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
const API = 'http://localhost:3000/upload'
const CHUNK_SIZE = 100 * 1024 * 1024

export async function uploadChunks(files) {
  for (const file of files) {
    const { size,name } = file
    const fileId = uuidv4()

    if (size > CHUNK_SIZE) {
      const chunks = Math.ceil(size / CHUNK_SIZE)
      let uploadedChunks = 0

      for (let i = 0; i < chunks; i++) {
        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, size)
        const chunk = file.slice(start, end)

        const formData = new FormData()
        formData.append('fileId', fileId)
        formData.append('chunks', chunks)
        formData.append(`chunk_${i}`, chunk, `${name}.${i}`)

        try {
          const response = await axios.post(API, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
          console.log(response)
          uploadedChunks++
          if (uploadedChunks === chunks) {
            console.log(`${} uploaded successfully!`)
          }
        } catch (error) {
          console.error(error)
          // Retry the current chunk if there was an error
          i--
        }
      }
    } else {
      const formData = new FormData()
      formData.append('fileId', fileId)
      formData.append('size', size)
      formData.append('chunks', 1)
      formData.append('file', file)

      try {
        const response = await axios.post(API, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        console.log(response)
        console.log(`${name} uploaded successfully!`)
      } catch (error) {
        console.error(error)
      }
    }
  }
}
