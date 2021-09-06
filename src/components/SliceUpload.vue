<template>
  <div class="hello">
    <el-upload
      class="upload-demo"
      drag
      action
      :auto-upload="false"
      :on-change="changFile"
      multiple>
      <i class="el-icon-upload"></i>
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <div class="el-upload__tip" slot="tip">只能上传jpg/png文件，且不超过500kb</div>
    </el-upload>

    <div class="progress">
      <!-- <span>上传进度: {{ total | totalText }}%</span> -->
      <el-link type="primary" v-if="total > 0 && total < 100" @click="handleBtn">{{ btn | btntext}}</el-link>
    </div>

    <div class="upload" v-if="video">
      <video :src="video" controls></video>
    </div>
  </div>
</template>

<script>
import { fileParse } from '@/utils'
import axios from 'axios'
import SparkMD5 from 'spark-md5'
export default {
  name: 'HelloWorld',
  data () {
    return {
      video: null,
      total: 0,
      btn: false,
      partList: []
    }
  },
  methods: {
    async changFile(file) {
      if (!file) return
      file = file.raw
      // 解析buffer数据
      const buffer = await fileParse(file, 'buffer')
      // 把文件切片， 可以固定数量或固定大小
      // HASH-1.mp4 HASH-2.mp4 HASH-3.mp4
      let hash = null
      console.log('buffer', buffer)
      const spark = new SparkMD5.ArrayBuffer()
      spark.append(buffer)
      console.log('spark', spark)
      hash = spark.end()
      const suffix = /\.([0-9a-zA-Z]+)$/i.exec(file.name)[1]
      const partList = []
      const partSize = file.size / 10
      let cur = 0
      for (let i = 0; i < 10; i++) {
        const item = {
          chunk: file.slice(cur, cur + partSize),
          filename: `${hash}_${i}.${suffix}`
        }
        cur += partSize
        partList.push(item)
      }
      this.partList = partList
      this.hash = hash
      this.sendRequest()
    },
    async sendRequest() {
      // 根据切片创建请求
      const requestList = []
      this.partList.forEach((item, index) => {
        const fn = () => {
          const formData = new FormData()
          formData.append('chunk', item.chunk)
          formData.append('filename', item.filename)

          return axios.post('/single3', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }).then(result => {
            result = result.data
            if (result.code === 0) {
              this.total += 1
              // 传完的切片移除掉
              this.partList.splice(index, 1)
            }
          })
        }
        requestList.push(fn)
      });

      // 传递： 并行(ajax.abort())||串行(基于标识控制不发送)
      // 并行一次发6个请求左右，根据浏览器，串行是一个发完接着下一个

      let i = 0
      const complete = async () => {
        let result = await axios.get('/merge', {
          params: {
            hash: this.hash
          }
        })
        result = result.data
        if (result.code === 0) {
          this.video = result.path
        }
      }
      const send = async () => {
        // 已经中断则不再上传
        if (this.abort) return;
        if (i >= requestList.length) {
          complete()
          return
        }
        await requestList[i]()
        i++
        send()
      }
      send()
    },
    handleBtn() {
      if (this.btn) {
        // 断点续传
        this.abort = false
        this.btn = false
        this.sendRequest()
        return
      }
      // 暂停上传
      this.btn = true
      this.abort = true
    }
  }
}
</script>

<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
