# 响应式数据原理

我们知道在使用 `React` 和 `Vue` 的时候，在修改数据的时候会触发视图渲染，`React` 修改数据是通过显示调用 `this.setState` 后触发渲染，而 `Vue` 则是通过 `this.xxx = xxx` 直接修改数据值后触发渲染，而且能做到只渲染使用了这个数据的对应模板

## 目标

再简化一点，`Vue` 的模板最终会编译成 `render` 方法，当 `this.name` 修改后，执行使用了 `name` 数据的 `render` 方法

```javascript
const person = { name: '张三' }

const Text = () => {
  console.log(person.name, 'person')
}

Text()

person.name = '李四' // 执行 Text 方法
```

如例子所示，`Text` 方法使用了 `person.name`，在修改 `person.name` 后，我们需要执行使用了该数据的 `Text` 方法，这是我们的实现目标

## 实现思路

有两个 api 能做到在对象属性读取和修改时，执行给定回调方法，分别是 `Object.defineProperty`、`Proxy`，`Vue2.x` 用的是前者，新的 `Vue3.x` 是后者，我们采用 [Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy) 来实现

根据目标，我们马上就能想到实现的大概模样

```javascript
function reactive(obj) {
  function getter(target, key) {
    // 依赖收集
  }

  function setter(target, key, value) {
    // 派发通知
  }

  const proxy = new Proxy(obj, {
    get: getter,
    set: setter,
  })

  return proxy
}
```

提供一个方法使一个对象转换成响应式对象，在这个响应式对象属性值修改的时候执行对应依赖这个对象属性的方法

可以看到关键代码就是 `getter` 和 `setter` 需要做的事请

在 `getter` 触发也就是目标对象的属性值被读取的时候，我们需要记录使用了这个目标对象的方法，以便在属性值修改时进行调用，也就是依赖收集

`setter` 在目标对象的属性值被修改时触发，要做的如上所说，找到保存好的依赖方法进行调用

那么第一个问题来了，在对象属性值被读取的时候，我们怎么知道是那个方法在读取呢

```javascript
const person = { name: '张三' }

const Text = () => {
  console.log(person.name, 'person')
}

Text()
```

拿上面的例子来说，`console.log(person.name, 'person')` 执行的时候怎么知道当前正在执行的方法是 `Text`

解决办法是提供一个包裹方法

```javascript
let currentDependentHandler = null

function wrap(fn) {
  if (fn.isReactive) return fn

  const reactiveHandler = function (...args) {
    currentDependentHandler = fn
    return fn.apply(this, args)
  }

  reactiveHandler.isReactive = true

  return reactiveHandler
}

const person = { name: '张三' }

const Text = wrap(() => {
  console.log(person.name, 'person')
})

Text() // currentDependentHandler = Text
```

我们提供一个 `wrap` 方法，主要的目的就是在传入的目标方法执行前，将该方法保存到 `currentDependentHandler` 变量中，这样我们就能在 `console.log(person.name, 'person')` 执行后通过 `currentDependentHandler` 拿到 `Text` 方法进行保存，`fn.isReactive` 是用来标记该方法已被 `wrap` 方法转换过，后续遇到直接返回该方法

在解决这个问题后，`setter` 做的事比较简单，就是执行保存好的依赖方法，将代码补充一下

```javascript
let currentDependentHandler = null

const dependentHandlerListMap = new Map()

function wrap(fn) {
  if (fn.isReactive) return fn

  const reactiveHandler = function (...args) {
    currentDependentHandler = fn
    return fn.apply(this, args)
  }

  reactiveHandler.isReactive = true

  return reactiveHandler
}

function reactive(obj) {
  function getter(target, key) {
    const dependentHandlerList = dependentHandlerListMap.get(target) || []

    if (!dependentHandlerList.includes(currentDependentHandler)) {
      dependentHandlerListMap.set(target, [...dependentHandlerList, currentDependentHandler])
    }

    return target[key]
  }

  function setter(target, key, value) {
    target[key] = value

    const dependentHandlerList = dependentHandlerListMap.get(target) || []

    dependentHandlerList.forEach(item => item())

    return true
  }

  const proxy = new Proxy(obj, {
    get: getter,
    set: setter,
  })

  return proxy
}
```

`getter` 在目标对象的属性被读取时，通过 `currentDependentHandler` 拿到依赖目标对象的方法起来，也就是依赖收集

`setter` 则是在目标对象的属性被设置时，将已保存好的依赖该目标对象的方法进行调用，也就是派发通知

到目前为止我们已经基本实现了响应式对象的功能

但是还有一个问题，也就是方法嵌套的场景，看如下示例

```javascript
let currentDependentHandler = null

function wrap(fn) {
  if (fn.isReactive) return fn

  const reactiveHandler = function (...args) {
    currentDependentHandler = fn
    return fn.apply(this, args)
  }

  reactiveHandler.isReactive = true

  return reactiveHandler
}

function reactive(obj) { 
  // ... 
}

const person = reactive({ name: '张三' })

const Button = wrap(() => {
  console.log(person.name, 'Button')
})

const Text = wrap(() => {
  Button()
  console.log(person.name, 'Text')
})

Text()
```

在 `Text` 方法开始执行 `currentDependentHandler = Text`，此时未读取对象属性，未收集依赖，紧接着 `Button` 方法执行，`currentDependentHandler = Button` 并且读取了对象属性，对 `Button` 方法进行依赖收集，当 `Button` 执行完毕后，`Text` 方法继续执行 `console.log(person.name, 'Text')` 读取了对象属性，但此时 `currentDependentHandler` 还是 `Button`，本该是对 `Text` 方法进行依赖收集而这里错误的继续将 `Button` 作为依赖方法

这里应该在依赖方法执行完毕后，将 `currentDependentHandler` 设置回父级方法，就像方法的调用栈一样，先进后出

1. `Text` 执行后入栈 `[Text]`
2. `Button` 执行后入栈 `[Text, Button]`
3. `Button` 执行完毕 `[Text]`
4. `Text` 执行完毕 `[]`

我们模拟该行为，完善 `Warp` 方法

```javascript
let currentDependentHandler = null

let currentDependentHandlerList = []

function wrap(fn) {
  if (fn.isReactive) return fn

  const reactiveHandler = function (...args) {
    currentDependentHandler = fn

    currentDependentHandlerList.push(fn)

    const returnValue = fn.apply(this, args)

    currentDependentHandlerList.pop()

    currentDependentHandler = currentDependentHandlerList[currentDependentHandlerList.length - 1]

    return returnValue
  }

  reactiveHandler.isReactive = true

  return reactiveHandler
}

function reactive(obj) { 
  // ... 
}

const person = reactive({ name: '张三' })

const Button = wrap(() => {
  console.log(person.name, 'Button')
})

const Text = wrap(() => {
  Button()
  console.log(person.name, 'Text')
})

Text()
```

这里我们新增了一个数组变量 `currentDependentHandlerList` 用于保存调用栈，在依赖方法执行后将依赖方法入栈，当依赖方法执行完毕后将依赖方法出栈，并且将 `currentDependentHandler` 设置回调用栈末尾的依赖方法

这时候我们再看执行过程

1. `Text` 执行后入栈 `currentDependentHandlerList = [Text]` `currentDependentHandler = Text`
2. `Button` 执行后入栈 `currentDependentHandlerList = [Text, Button]` `currentDependentHandler = Button`
3. `Button` 执行完毕 `currentDependentHandlerList = [Text]` `currentDependentHandler = Text`
4. `Text` 执行完毕 `currentDependentHandlerList = []` `currentDependentHandler = undefined`

在 `Button` 执行完毕后，执行作用域归还给 `Text` `currentDependentHandler = Text` 这样就处理了嵌套方法的依赖收集

到这里我们就完成了全部功能，处理了嵌套方法的场景

完整代码 [reactive.js](https://github.com/Wzijie/blog/blob/master/src/article/JS/demo/reactive.js)

```javascript
let currentDependentHandler = null

let currentDependentHandlerList = []

const dependentHandlerListMap = new Map()

function wrap(fn) {
  if (fn.isReactive) return fn

  const reactiveHandler = function (...args) {
    currentDependentHandler = fn

    currentDependentHandlerList.push(fn)

    const returnValue = fn.apply(this, args)

    currentDependentHandlerList.pop()

    currentDependentHandler = currentDependentHandlerList[currentDependentHandlerList.length - 1]

    return returnValue
  }

  reactiveHandler.isReactive = true

  return reactiveHandler
}

function reactive(obj) {
  function getter(target, key) {
    const dependentHandlerList = dependentHandlerListMap.get(target) || []

    if (!dependentHandlerList.includes(currentDependentHandler)) {
      dependentHandlerListMap.set(target, [...dependentHandlerList, currentDependentHandler])
    }

    return target[key]
  }

  function setter(target, key, value) {
    target[key] = value

    const dependentHandlerList = dependentHandlerListMap.get(target) || []

    dependentHandlerList.forEach(item => item())

    return true
  }

  const proxy = new Proxy(obj, {
    get: getter,
    set: setter,
  })

  return proxy
}

export { wrap, reactive }

/* example

const person = reactive({ name: '张三' })

const cat = reactive({ name: '蓝胖' })

const Button = wrap(() => {
  console.log(cat.name, 'Button cat.name')
})

const Text = wrap(() => {
  Button()
  console.log(person.name, 'Text person.name')
})

Text()

person.name = '李四'

cat.name = '橘胖'

*/
```
