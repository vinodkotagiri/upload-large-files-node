const CHUNK_SIZE = 100 * 1024 * 1024 // 100 MB in bytes

function sendFile(file, url) {
  let offset = 0
  let chunksSent = 0
  const fileSize = file.size
  const readChunk = function () {
    const reader = new FileReader()

    reader.onload = function () {
      if (reader.error) {
        console.error(reader.error)
        return
      }
      const chunk = reader.result
      chunksSent++
      const fileDetails = {
        originalname: file.name,
        encoding: file.encoding,
        mimetype: file.type,
        path: file.webkitRelativePath
      }
      sendChunk(chunk, offset, fileSize, url, fileDetails)
      offset += chunk.byteLength
      if (offset < fileSize) {
        readChunk()
      } else {
        console.log(`Sent ${chunksSent} chunks`)
      }
    }

    const blob = file.slice(offset, offset + CHUNK_SIZE)
    reader.readAsArrayBuffer(blob)
  }
  readChunk()
}

function sendChunk(chunk, offset, fileSize, url, fileDetails) {
  const endByte = Math.min(offset + chunk.byteLength - 1, fileSize - 1)

  const headers = {
    'Content-Type': 'application/octet-stream',
    'Content-Range': `bytes ${offset}-${endByte}/${fileSize}`,
    'X-File-Details': JSON.stringify(fileDetails)
  }

  const options = {
    method: 'PUT',
    headers: headers,
    body: chunk
  }

  fetch(url, options)
    .then(function (response) {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`)
      }
      console.log(`Sent chunk ${offset}-${endByte}`)
    })
    .catch(function (error) {
      console.error(error)
    })
}

// Example usage
const fileInput = document.getElementById('file-input')
const uploadButton = document.getElementById('upload-button')

uploadButton.addEventListener('click', function () {
  const file = fileInput.files[0]
  console.log(file)
  sendFile(file, 'http://localhost:3000/upload')
})
