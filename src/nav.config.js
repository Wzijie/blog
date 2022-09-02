const navConfig = [{
  name: 'JavaScript',
  children: [{
    name: '微前端 qiankun loadMicroApp 实现思路',
    path: '/JS/loadMicroApp',
    createTime: 1662087907365,
    updateTime: 1662087907365,
  }, {
    name: 'img-zoom 图片宽高缩放',
    path: '/JS/img-zoom',
    createTime: '2020-07-08 18:24',
    updateTime: '2020-07-08 18:24',
  }, {
    name: '数组乱序',
    path: '/JS/array-disorder',
    createTime: '2020-07-10 17:06',
    updateTime: '2020-07-10 17:06',
  }, {
    name: '用遍历来实现斐波那契数列',
    path: '/JS/fibonacci',
    createTime: '2020-07-10 17:06',
    updateTime: '2020-07-10 17:06',
  }],
}, {
  name: 'CSS',
  children: [{
    name: 'backdrop-filter 实现毛玻璃效果',
    path: '/CSS/backdrop-filter',
    createTime: '2020-06-10 16:09',
    updateTime: '2020-06-10 16:09',
  }],
}, {
  name: 'HTML',
  children: [],
}, {
  name: '笔记',
  children: [{
    name: '一次内存泄漏排查过程',
    path: '/note/一次内存泄漏排查过程',
    createTime: '2022-06-15 00:00',
    updateTime: '2022-06-15 00:00',
  }, {
    name: '超过最大整数精度丢失',
    path: '/note/超过最大整数精度丢失',
    createTime: '2021-02-05 10:53',
    updateTime: '2021-02-05 15:19',
  }],
}, {
  name: '其他',
  children: [{
    name: '基于GitHub Webhook自动部署',
    path: '/other/automatic-deploy',
    createTime: '2020-06-12 15:05',
    updateTime: '2020-06-13 15:14',
  }],
}, {
  name: '随笔',
  children: [{
    name: '2019 年终总结',
    path: '/essay/summary-2019',
    createTime: '2020-06-10 16:09',
    updateTime: '2020-06-12 17:19',
  }],
}];

// 需要用 node 获取该文件内容，所以使用 module.exports
module.exports = navConfig;
// export default navConfig;
