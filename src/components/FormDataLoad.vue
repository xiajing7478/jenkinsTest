<template>
  <div class="flex-wrap">
    <div class="sub">
      <p>基于formdata上传文件</p>
      <el-upload
        class="upload-demo"
        drag
        action="/single1"
        :before-upload="beforeUpload"
        :on-success="handleSuccess"
        multiple>
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip" slot="tip">只能上传jpg/png文件，且不超过{{maxSize}}M</div>
      </el-upload>
      <div class="over-img" v-if="img">
        <img :src="img" alt="image">
      </div>
    </div>

    <div class="sub">
      <p>基于base64上传文件</p>
      <el-upload
        class="upload-demo"
        drag
        action
        :auto-upload="false"
        :on-change="changFile"
        multiple>
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip" slot="tip">只能上传jpg/png文件，且不超过{{maxSize}}M</div>
      </el-upload>
      <div class="over-img" v-if="img2">
        <img :src="img2" alt="image">
      </div>
    </div>

    <div class="sub">
      <p>切片上传</p>
      <el-upload
        class="upload-demo"
        drag
        action
        :auto-upload="false"
        :on-change="changVideoFile"
        multiple>
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip" slot="tip">只能上传jpg/png文件，且不超过{{videoMaxSize}}M</div>
      </el-upload>

      <p class="progress">
        <span>上传进度: {{ total | totalText }}%</span>
        <el-link type="primary" v-if="total > 0 && total < 100" @click="handleBtn">{{ btn | btntext}}</el-link>
      </p>

      <p class="over-img" v-if="video">
        <video :src="video" controls></video>
      </p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import qs from 'qs'
import SparkMD5 from 'spark-md5'
import { isPicture, checkSize, fileParse } from '@/utils/index.js'
export default {
  name: 'form-data-load',
  data () {
    return {
      img: null,
      img2: null,
      maxSize: 20,
      total: 0,
      videoMaxSize: 500,
      video: null,
      btn: false
    }
  },
  filters: {
    btntext(btn) {
      return btn ? '继续' : '暂停';
    },
    totalText(total) {
      return total > 100 ? 100 : total
    }
  },
  methods: {
    beforeUpload(file) {
      const { type, size } = file
      if (!isPicture(type)) {
        this.$message('文件格式不正确')
        return false
      }
      if (checkSize(size, this.maxSize)) {
        this.$message('文件过大')
        return false
      }
      return true
    },
    handleSuccess(result) {
      if (result.code === 0) {
        this.img = result.path
      }
    },
    async changFile(file) {
      if (!file) return
      file = file.raw
      const result = await fileParse(file)
      axios.post('/single2', qs.stringify({
        chunk: encodeURIComponent(result),
        filename: file.name
      })).then(res => {
        if (res.data.code === 0) {
          this.img2 = res.data.path
        }
      })
    },
    async changVideoFile(file) {
      if (!file) return
      file = file.raw
      const buffer = await fileParse(file)
      // 解析为BUFFER数据
      // 我们会把文件切片处理：把一个文件分割成为好几个部分（固定数量/固定大小）
      // 每一个切片有自己的部分数据和自己的名字
      // HASH_1.mp4
      // HASH_2.mp4
      // ...
      const spark = new SparkMD5.ArrayBuffer()
      spark.append(buffer)
      const hash = spark.end()
      const suffix = /\.([0-9a-zA-Z]+)$/i.exec(file.name)[1]

      // 创建10个切片
      const partList = []
      const partSize = file.size / 10
      let curIndex = 0
      for (let i = 0; i < 10; i++) {
        const item = {
          chunk: file.slice(curIndex, curIndex + partSize),
          filename: `${hash}_${i}.${suffix}`
        }
        curIndex += partSize
        partList.push(item)
      }
      this.partList = partList
      this.hash = hash
      this.sendRequest()
    },
    sendRequest() {
      // 根据10个切片创造10个请求（集合）
      const requestList = []
      this.partList.forEach((item, index) => {
        const fn = () => {
          const formData = new FormData()
          formData.append('chunk', item.chunk)
          formData.append('filename', item.filename)
          return axios.post('/single3', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          }).then(result => {
            result = result.data
            if (result.code === 0) {
              this.total += 10
              // 传完的切片我们把它移除掉
              this.partList.splice(index, 1)
            }
          })
        }
        requestList.push(fn)
      })

      // 传递：并行(ajax.abort())/串行(基于标志控制不发送)
      let i = 0
      const complete = async () => {
        let result = await axios.get('/merge', {
          params: { hash: this.hash }
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
          // 都上传完成了
          complete()
          return;
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
      this.abort = true
      this.btn = true
    }
  }
}
</script>

<style scoped>
.flex-wrap {
  display: flex;
  justify-content: center;
}
.flex-wrap .sub {
  flex: 1;
}
.over-img img, .over-img video   {
  max-width: 360px;
}
</style>
