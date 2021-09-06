export function fileParse(file, type = 'base64') {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    if (type === 'base64') {
      fileReader.readAsDataURL(file)
    } else if (type === 'buffer') {
      fileReader.readAsArrayBuffer(file)
    }
    fileReader.onload = (res) => {
      resolve(res.target.result)
    }
  })
}

export function isPicture(type) {
  return /(png|gif|jpeg|jpg)/i.test(type)
}

export function checkSize(fileSize, maxSize) {
  return (fileSize > maxSize * 1024 * 1024)
}
