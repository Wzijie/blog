const navConfig = [{
  name: 'JavaScript',
  children: [{
    name: '数组乱序',
    path: '/JS/array-disorder',
  },{
    name: '用遍历来实现斐波那契数列',
    path: '/JS/fibonacci',
  }, {
    name: 'img-zoom 图片宽高缩放',
    path: '/JS/img-zoom',
  }],
}, {
  name: 'CSS',
  children: [{
    name: 'backdrop-filter 实现毛玻璃效果',
    path: '/CSS/backdrop-filter',
  }],
}, {
  name: 'HTML',
  children: [],
}, {
  name: '其他',
  children: [{
    name: '基于GitHub Webhook自动部署',
    path: '/other/automatic-deploy',
  }],
}, {
  name: '随笔',
  children: [{
    name: '2019 年终总结',
    path: '/essay/summary-2019',
  }],
}];

export default navConfig;
