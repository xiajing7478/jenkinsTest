# jenkins-test

> A Vue.js project

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```


## 上传一般有2种方式
1. 基于文件流(form-data) element-ui基于文件流
2. 基于base64, 客户端需要把文件转化为BASE64
3. sparkMD5根据内容来生成hash，也就是说2个图片名称不一样，但内容一样，只会覆盖前一张图片

client(客户端)启动： npm run dev
serve(服务端)启动：node server/app.js
