import Vue from 'vue'
import Router from 'vue-router'
// import HelloWorld from '@/components/HelloWorld'
// import SliceUpload from '@/components/SliceUpload'
import FormDataLoad from '@/components/FormDataLoad'
// import Base64 from '@/components/Base64'
Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'FormDataLoad',
      component: FormDataLoad
    }
  ]
})
