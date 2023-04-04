import React, { useState } from 'react'
// import { uploadChunks } from './helpers/upload'
import { uploadFile } from './helpers/uploadblocks'

export default function App() {
  const [files, setFiles] = useState([])
  //function to handle file selection
  function handleFileSelection(e) {
    const fileList = Array.from(e.target.files)
    const file = fileList[0]
    setFiles(file)
  }
  //function to handle submit form
  async function handleSubmit(e) {
    e.preventDefault()
    const responses = await uploadFile(files)
    console.log('UPloaded succesfully', responses)
  }
  return (
    <form onSubmit={handleSubmit}>
      <input type='file' onChange={handleFileSelection} name='file' />
      <button type='submit'>Upload</button>
    </form>
  )
}
