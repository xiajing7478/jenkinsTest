<template>
  <div>
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
    <div v-if="img">
      <img :src="img" alt="image">
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import qs from 'qs'
import { fileParse } from '@/utils'
export default {
  name: 'base64',
  data () {
    return {
      img: null
    }
  },
  methods: {
    async changFile(file) {
      if (!file) return
      file = file.raw
      const result = await fileParse(file)
      axios.post('/single2',
        qs.stringify({
          chunk: encodeURIComponent(result),
          fileName: file.name
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }).then(result => {
        if (result.data.code === 0) {
          this.img = result.data.path
        }
      })
    },
    beforeUpload(file) {
      console.log('file', file)
      const { type, size } = file
      if (!/(png|gif|jpeg|jpg)/i.test(type)) {
        this.$message('文件格式不正确')
        return false
      }
      if (size > 200 * 1024 * 1024) {
        this.$message('文件过大，请上传小于200M的文件')
        return false
      }
      return true
    },
    handleSuccess(result) {
      if (result.code === 0) {
        this.img = result.path
      }
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
