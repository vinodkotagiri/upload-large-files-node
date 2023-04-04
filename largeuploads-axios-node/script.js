const uploadFile = async (file) => {
  const chunkSize = 4 * 1024 * 1024 // 4 MB chunks
  const totalChunks = Math.ceil(file.size / chunkSize)
  let uploadedChunks = 0
  let blockIds = []

  const fileId = uuidv4() // generate a unique ID for this file

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, file.size)
    const chunk = file.slice(start, end)

    const formData = new FormData()
    formData.append('fileId', fileId)
    formData.append('chunkId', i + 1)
    formData.append('chunk', chunk)

    try {
      const res = await fetch('/upload', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        console.error(`Error uploading chunk ${i + 1}: ${await res.text()}`)
        return
      }

      blockIds.push(await res.text())
      uploadedChunks++
      console.log(`Chunk ${i + 1} uploaded successfully.`)
    } catch (err) {
      console.error(`Error uploading chunk ${i + 1}: ${err.message}`)
      return
    }
  }

  try {
    const res = await fetch('/commit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId,
        blockIds
      })
    })

    if (!res.ok) {
      console.error(`Error committing blocks: ${await res.text()}`)
      return
    }

    console.log('File uploaded successfully.')
  } catch (err) {
    console.error(`Error committing blocks: ${err.message}`)
  }
}
