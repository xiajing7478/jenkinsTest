const express = require('express')
const fs = require('fs')
const app = express()
const bodyParser = require('body-parser')
const multiparty = require('multiparty')
const SparkMD5 = require('spark-md5')
const uploadDir = `${__dirname}/upload`
const PORT = 8899

app.use(bodyParser.urlencoded({
  extended: false,
  limit: '1024mb'
}))

function handleMultiparty(req, res, flag = false) {
  return new Promise((resolve, reject) => {
    // multiparty的配置
    const options = {
      maxFieldsSize: 500 * 1024 * 1024
    }
    !flag ? options.uploadDir = uploadDir : null
    const form = new multiparty.Form(options)
    // multiparty解析
    form.parse(req, function(err, fields, files) {
      if (err) {
        res.send({
          code: 1,
          msg: err
        })
        reject(err)
        return;
      }
      resolve({
        fields,
        files
      })
    })
  })
}

app.post('/single1', async(req, res) => {
  const { files } = await handleMultiparty(req, res)
  const file = files.file[0]
  res.send({
    code: 0,
    originalFilename: file.originalFilename,
    path: file.path.replace(__dirname, `http://127.0.0.1:${PORT}`)
  })
})

app.post('/single2', (req, res) => {
  // let { chunk, filename } = req.body
  let chunk = req.body.chunk
  const filename = req.body.filename
  // chunk的处理：转换为buffer
  chunk = decodeURIComponent(chunk);
  chunk = chunk.replace(/^data:image\/\w+;base64,/, '');
  chunk = Buffer.from(chunk, 'base64');

  // 存储文件到服务器
  const spark = new SparkMD5.ArrayBuffer()
  const suffix = /\.([0-9a-zA-Z]+)$/.exec(filename)[1]
  spark.append(chunk)
  const path = `${uploadDir}/${spark.end()}.${suffix}`
  fs.writeFileSync(path, chunk)
  res.send({
    code: 0,
    originalFilename: filename,
    path: path.replace(__dirname, `http://127.0.0.1:${PORT}`)
  });
})

app.post('/single3', async(req, res) => {
  const { fields, files } = await handleMultiparty(req, res, true)
  const [chunk] = files.chunk
  const [filename] = fields.filename
  const hash = /([0-9a-zA-Z]+)_\d+/.exec(filename)[1]
  let path = `${uploadDir}/${hash}`
  !fs.existsSync(path) ? fs.mkdirSync(path) : null
  path = `${path}/${filename}`
  fs.access(path, async err => {
    // 存在的话，不再进行任何的处理
    if (!err) {
      res.send({
        code: 0,
        path: path.replace(__dirname, `http://127.0.0.1:${PORT}`)
      })
      return;
    }

    await new Promise(resolve => {
      setTimeout(() => {
        resolve()
      }, 200)
    })

    // 不存在创建
    const readStream = fs.createReadStream(chunk.path)
    const writeStream = fs.createWriteStream(path)
    readStream.pipe(writeStream)
    readStream.on('end', function() {
      fs.unlinkSync(chunk.path)
      res.send({
        code: 0,
        path: path.replace(__dirname, `http://127.0.0.1:${PORT}`)
      })
    })
  })
})

app.get('/merge', (req, res) => {
  const { hash } = req.query
  const path = `${uploadDir}/${hash}`
  const fileList = fs.readdirSync(path)
  let suffix
  fileList.sort((a, b) => {
    const reg = /_(\d+)/
    return reg.exec(a)[1] - reg.exec(b)[1]
  }).forEach(item => {
    !suffix ? suffix = /\.([0-9a-zA-Z]+)$/.exec(item)[1] : null;
    fs.appendFileSync(`${uploadDir}/${hash}.${suffix}`, fs.readFileSync(`${path}/${item}`));
    fs.unlinkSync(`${path}/${item}`);
  })

  fs.rmdirSync(path)
  res.send({
    code: 0,
    path: `http://127.0.0.1:${PORT}/upload/${hash}.${suffix}`
  })
})

app.listen(PORT, () => {
  console.log(`the service is start on the port ${PORT}`)
})
app.use(express.static('./'));
app.use((req, res) => {
  res.status(404);
  res.send('NOT FOUND!');
});
