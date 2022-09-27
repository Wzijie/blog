# 微前端 qiankun loadMicroApp 实现思路

最近了解到了 `qiankun` 这个微前端库，受好奇心驱使下想学习一下 `qiankun` 是如何加载一个微应用的

## 什么是微前端

> Techniques, strategies and recipes for building a modern web app with multiple teams that can ship features independently. -- [Micro Frontends](https://micro-frontends.org/)
>
> 微前端是一种多个团队通过独立发布功能的方式来共同构建现代化 web 应用的技术手段及方法策略。

具体场景就是有一个主应用入口包含了多个子应用业务项目，将所有子应用业务项目都放到一起就会导致代码量越发庞大且无法独立发布，再者可能某个子应用比如像客服系统需要被多个项目加载使用，此时就会很困难，为了解决这些问题需要将各个子应用独立出来

子应用独立后各个项目就可以按需要去加载，而加载方式最常用最简单的就是使用 `iframe`，再因为 `iframe` 的一些弊端从而诞生了像 `qiankun` 这样的微前端库

## loadMicroApp(app, configuration?)

`loadMicroApp` 是 `qiankun` 其中一个加载微应用的 api，先看参数定义

- app - `LoadableApp` - 必选，微应用的基础信息

  - name - `string` - 必选，微应用的名称，微应用之间必须确保唯一。
  - entry - `string | { scripts?: string[]; styles?: string[]; html?: string }` - 必选，微应用的入口（详细说明同上）。
  - container - `string | HTMLElement` - 必选，微应用的容器节点的选择器或者 Element 实例。如`container: '#root'` 或 `container: document.querySelector('#root')`。
  - props - `object` - 可选，初始化时需要传递给微应用的数据。

第二个可选参数 `configuration` 先忽略

现在开始实现 loadMicroApp 方法

### 获取 HTML

```javascript
const fetchHTML = entry => fetch(entry).then(response => response.text())

const loadMicroApp = app => {
  const { name, entry, container, props } = app

  const containerElement = typeof container === 'string'
    ? document.querySelector(container)
    : container

  const html = await fetchHTML(entry)

  const rootElement = document.createElement('div')

  rootElement.innerHTML = html

  // 加载样式

  // 加载 JS
}
```

首先根据 entry 入口获取到微应用 HTML，后续从 HTML 中解析出 style、link、script 标签进行加载，可以用正则匹配，这里我更喜欢用 DOM API 进行解析

### 加载样式

接下来开始加载样式

```javascript
const loadStyle = (entry, rootElement) => {
  const styleNodeList = [...rootElement.querySelectorAll('link[rel="stylesheet"],style')]

  styleNodeList.forEach(item => {
    if (item.nodeName === 'LINK') {
      item.setAttribute('href', `${entry}${item.getAttribute('href')}`)
    }

    document.head.append(item)
  })
}
```

从根节点中获取到 link、style 标签，然后全部插入到 `document.head` 就可以了，注意 link 标签的 href 需要拼接入口地址

还有个问题就是 css 污染，加载的样式会影响到主应用，需要进行样式隔离，隔离方案使用 [shadow DOM](https://developer.mozilla.org/zh-CN/docs/Web/Web_Components/Using_shadow_DOM)

> Web components 的一个重要属性是封装——可以将标记结构、样式和行为隐藏起来，并与页面上的其他代码相隔离，保证不同的部分不会混在一起，可使代码更加干净、整洁。其中，Shadow DOM 接口是关键所在，它可以将一个隐藏的、独立的 DOM 附加到一个元素上。本篇文章将会介绍 Shadow DOM 的基础使用。

我们根据 shadow DOM 文档介绍的使用方式进行改造

```javascript
const loadStyle = (entry, rootElement, containerElement) => {
  const styleNodeList = [...rootElement.querySelectorAll('link[rel="stylesheet"],style')]

  const shadowHost = document.createElement('div')

  const shadow = shadowHost.attachShadow({ mode: 'open' });

  const root = document.createElement('div')

  root.setAttribute('id', 'root')

  styleNodeList.forEach(item => {
    if (item.nodeName === 'LINK') {
      item.setAttribute('href', `${entry}${item.getAttribute('href')}`)
    }

    shadow.append(item)
  })

  shadow.append(root)

  containerElement.append(shadowHost)

  return shadowHost
}
```

具体就是将样式标签插入到 shadow root 节点，并且后续子应用也挂载到该节点下，这样就能保证 shadow root 节点下的内容与外界隔离

### 加载 JS

```javascript
const loadScript = async (entry, rootElement) => {
  const scriptNodeList = [...rootElement.querySelectorAll('script')]

  for (let item of scriptNodeList) {
    await new Promise(resolve => {
      const script = document.createElement('script')

      const src = item.getAttribute('src')

      if (item.innerHTML) script.innerHTML = item.innerHTML

      if (src) {
        script.setAttribute('src', `${entry}${src}`)
        script.addEventListener('load', () => resolve())
      } else {
        resolve()
      }

      document.body.append(script)
    })
  }
}
```

和加载样式差不多，创建 script 标签并且设置 innerHTML、src 属性后按顺序插入到 `document.body` 内

加载完样式和 JS 后就可以开始挂载微应用了

### 加载微应用

我们需要调用微应用提供的挂载方法，那么主应用如何获取到微应用提供的一些加载、卸载方法呢

通过 webpack 构建的微应用需要进行如下改造，详细可查看 `qiankun` 文档

```javascript
// 入口文件
function render(props) {
  const { container } = props;
  ReactDOM.render(<App />, container ? container.querySelector('#root') : document.querySelector('#root'));
}

if (!window.__POWERED_BY_QIANKUN__) {
  render({});
}

export async function mount(props) {
  console.log('[react16] props from main framework', props);
  render(props);
}

export async function unmount(props) {
  const { container } = props;
  ReactDOM.unmountComponentAtNode(container ? container.querySelector('#root') : document.querySelector('#root'));
}
```

导出 `mount` `unmount` 方法，`window.__POWERED_BY_QIANKUN__` 会在主应用设置为 true，当不作为微应用被加载到主应用使用时直接渲染

```javascript
// webpack config
const { name } = require('./package');

return {
  // ...
  output: {
    // ...
    jsonpFunction: `webpackJsonp_${name}`,
    globalObject: 'window',
    library: `${name}-[name]`,
    libraryTarget: 'umd',
    // ...
  },
  // ...
}
```

调整 webpack config output 配置项的 jsonpFunction、globalObject、library、libraryTarget，name 需要与入参 app.name 一致，这些改动主要是为了让入口文件导出的内容挂载到全局对象 `window` 上，主应用可以通过 `window[app.name]` 拿到微应用暴露的方法进行调用

```javascript
const loadMicroApp = async app => {
  const { name, entry, container, props = {} } = app

  const containerElement = typeof container === 'string'
    ? document.querySelector(container)
    : container

  const html = await fetchHTML(entry)

  const rootElement = document.createElement('div')

  rootElement.innerHTML = html

  const shadowHost = loadStyle(entry, rootElement, containerElement)

  await loadScript(entry, rootElement)

  const microApp = window[name]

  microApp.mount({ ...props, container: shadowHost.shadowRoot })

  const unmount = () => {
    microApp.unmount(props)
    shadowHost.remove()
  }

  return {
    ...microApp,
    unmount,
  }
}
```

最后调用微应用提供的 `mount` 方法加载微应用，并且返回一个处理后的 `unmount` 方法就完成了

## JS 污染

假设主应用有个全局变量 `window.num = 1`，微应用有个全局变量 `window.num = 2`，因为共用同一个全局对象那么主应用的变量就会被改写，这在微应用运行期间是无法避免的

运行期间无法避免但是我们可以在微应用卸载时将微应用造成的副作用清除，以求将伤害降到最低

思路是在微应用运行期间对 `window` 对象的属性赋值进行记录，在卸载时进行一个 “revert”

微应用 `window.num = 2` 记录将 num 从 1 改成了 2，卸载时 `window.num = 1` 将值改为修改前的 1

具体代码实现

```javascript
const globalSideEffectList = []

// 监听赋值动作记录副作用
const proxy = new Proxy(window, {
  set(target, key, value) {
    const current = target[key]

    globalSideEffectList.push({
      key,
      current,
      next: value,
      revert: () => (target[key] = current),
    })

    target[key] = value
  }
})

// 卸载时进行 revert
globalSideEffectList.reverse.forEach(({ revert }) => revert())
```

在微应用运行期间我们用 `Proxy` 监听全局对象 `window` 的赋值动作将副作用存到 `globalSideEffectList` 列表中，卸载时就可以一一进行 revert

还有一个问题是如何让加载的微应用使用我们进行监听的 `Proxy` 对象而不是 `window`

假设微应用有 `<script>window.num = 2</script>` 这样的代码，我们希望是 `Proxy.num = 2`，而不是 `window`

处理方式为将请求回来的 JS 用一个方法包裹起来，并且设置 `window` 入参为我们的 `Proxy`，然后用 `eval` 方法手动执行

类似这样

```javascript
const proxy = {}
const microAppCode = 'window.num = 2'
const evalCode = `(function(window){${microAppCode}})(proxy)`
eval(evalCode)
console.log(proxy.num) // 2
```

这样就能让微应用的 `window` 对象使用我们的 `proxy`，从而监听赋值动作

## 最后

完整代码 [loadMicroApp.js](https://github.com/Wzijie/blog/blob/master/src/article/JS/demo/loadMicroApp.js)

```javascript
const fetchHTML = entry => fetch(entry).then(response => response.text())

const loadStyle = (entry, rootElement, containerElement) => {
  const styleNodeList = [...rootElement.querySelectorAll('link[rel="stylesheet"],style')]

  const shadowHost = document.createElement('div')

  const shadow = shadowHost.attachShadow({ mode: 'open' });

  const root = document.createElement('div')

  root.setAttribute('id', 'root')

  styleNodeList.forEach(item => {
    if (item.nodeName === 'LINK') {
      item.setAttribute('href', `${entry}${item.getAttribute('href')}`)
    }

    shadow.append(item)
  })

  shadow.append(root)

  containerElement.append(shadowHost)

  return shadowHost
}

const loadScript = async (entry, rootElement) => {
  const scriptNodeList = [...rootElement.querySelectorAll('script')]

  for (let item of scriptNodeList) {
    await new Promise(resolve => {
      const script = document.createElement('script')

      const src = item.getAttribute('src')

      if (item.innerHTML) script.innerHTML = item.innerHTML

      if (src) {
        script.setAttribute('src', `${entry}${src}`)
        script.addEventListener('load', () => resolve())
      } else {
        resolve()
      }

      document.body.append(script)
    })
  }
}

const loadMicroApp = async app => {
  const { name, entry, container, props = {} } = app

  const containerElement = typeof container === 'string'
    ? document.querySelector(container)
    : container

  const html = await fetchHTML(entry)

  const rootElement = document.createElement('div')

  rootElement.innerHTML = html

  const shadowHost = loadStyle(entry, rootElement, containerElement)

  await loadScript(entry, rootElement)

  const microApp = window[name]

  microApp.mount({ ...props, container: shadowHost.shadowRoot })

  const unmount = () => {
    microApp.unmount && microApp.unmount({ ...props, container: shadowHost.shadowRoot })
    shadowHost.remove()
  }

  return {
    ...microApp,
    unmount,
  }
}
```

散会🎉
