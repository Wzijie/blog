# React useState 实现思路

如果让我来设计 `useState` 方法该怎么做？

## useState(initialState?)

仅有一个可选参数 `initialState` 初始值

`useState` 方法定义

```javascript
function useState(initialState) { ... }

const Person = () => {
  const [name, setName] = useState('张三')
  console.log(name)
  return setName
}

const setName = Person() // 张三
Person() // 张三
setName('李四')
Person() // 李四
```

返回一个数组，数组第 0 项为 state，第 1 项为 setState 用于更改 state，state 仅能由 setState 更改，不受组件方法调用次数影响

state 初始值为入参 initialState

## 实现思路

这里将普通的函数称为 “组件”

首先我们需要一个 map 用于存储组件对应的 state，因为会有多个值所以用数组来存

map 的 key 为调用的组件

```javascript
const componentStateMap = new Map()

function useState(initialState) {
  // 用 arguments.callee.caller 调用方作为 key 存值
  const caller = arguments.callee.caller

  const { stateList = [] } = componentStateMap.get(caller) || {}

  stateList.push(initialState)

  componentStateMap.set(caller, { stateList })

  return [initialState]
}
```

这里有几个问题

这是首次调用的处理，我们将初始值保存起来，但是再次调用我们需要取值而不是存值，如何确定方法是否为首次调用？

`useState` 有可能调用多次也就有多个值，在后续调用取值的时候如何确定每个 `useState` 对应数组里哪一项的值？

```javascript
function useState(initialState) { ... }

const Person = () => {
  const [name, setName] = useState('张三')
  const [age, setAge] = useState(18)
}

Person() // stateList = ['张三', 18]
Person() // stateList = ['张三', 18, '张三', 18] ×
```

我们需要标记组件是首次调用 mount 还是后续调用 update

mount 状态我们需要存值确定 stateList 的长度

在后续调用 update 状态时我们需要根据 `useState` 调用顺序来取值，对应的也就需要存一个 `index` 用来标记当前 `useState` 为第几次调用，当 index 大于等于 stateList 的长度时，我们就能知道组件本次调用中所有 `useState` 已经执行完毕，可以将 index 重置为 0 准备下次组件调用

改造一下

```javascript
const MOUNT = 'mount'
const UPDATE = 'update'
const componentStateMap = new Map()

// 使用 useState 的组件需要用 wrap 方法包裹，主要作用为标记组件的状态 MOUNT or UPDATE
function wrap(component) {
  component.action = MOUNT

  return function(...args) {
    const result = component.apply(this, args)
    if (component.action === MOUNT) component.action = UPDATE
    return result
  }
}

function useState(initialState) {
  // 用 arguments.callee.caller 调用方作为 key 存值
  const caller = arguments.callee.caller

  const { stateList = [], index = 0 } = componentStateMap.get(caller) || {}

  let nextIndex = index

  // MOUNT 初次调用将初始值保存，确定 stateList 长度也就是 useState 调用次数
  if (caller.action === MOUNT) {
    stateList.push(initialState)
  }

  // UPDATE 后续调用需要根据 uesState 调用次数将 index 重置回 0，也就是当 index 大于 stateList 长度时
  if (caller.action === UPDATE) {
    nextIndex = index >= stateList.length ? 0 : index
  }

  // 每次调用时 index + 1 记录下一次调用 useState 对应 stateList 的值 
  componentStateMap.set(caller, { stateList, index: nextIndex + 1 })

  return [stateList[nextIndex]]
}
```

我们用一个 wrap 方法包裹组件用于标记组件状态，在 mount 初始调用下进行存值，update 后续调用时需要根据 uesState 调用次数判断是否将 index 重置为 0

这也解释了为什么 useState 不能放在条件语句内，因为需要确保每次调用的 useState 的次数都是一致的，这样根据 index 取值才能正常工作

那么有没有办法能打破这种限制呢？

做法其实就是用 map 代替 array 进行存储 state

既然我们需要用 useState 调用次数作为 index 来取值，那么我们直接改为用 map 对象存就好了

类似这样

```javascript
// ...
function useState(stateKey, initialState) {
  const caller = arguments.callee.caller

  const { stateMap = {} } = componentStateMap.get(caller) || {}

  if (caller.action === MOUNT) {
    stateMap[stateKey] = initialState
  }

  componentStateMap.set(caller, { stateMap })

  return [stateMap[stateKey]]
}

const Person = () => {
  const [name, setName] = useState('a', '张三')
  const [age, setAge] = useState('b', 18)
}
```

我们新增一个入参 `stateKey` 作为 key 进行存值，不管 `useState` 调用了几次，我们始终用这个 key 进行取值

这个 key 可以是任意字符串，只要每个 `useState` 各不相同就行

而这个方案的缺点就是...... 没有那么简洁，想象一下以下代码

```javascript
const Person = () => {
  const [name, setName] = useState('abcdefg', '张三')
  const [age, setAge] = useState('啊啊啊啊啊啊啊', 18)
  // ...
}

const Component = () => {
  const [name, setName] = useState('任意字符', '张三')
  const [age, setAge] = useState('useState', 18)
  // ...
}
```

这个 key 在业务上没有意义仅为了 useState 正常工作而存在

让我们期待一下 React 团队会有什么方案吧......

## 最后

完整代码 [useState.js](https://github.com/Wzijie/blog/blob/master/src/article/JS/demo/useState.js)

```javascript
const MOUNT = 'mount'
const UPDATE = 'update'
const componentStateMap = new Map()

// 使用 useState 的组件需要用 wrap 方法包裹，主要作用为标记组件的状态 mount or update
function wrap(component) {
  component.action = MOUNT

  return function(...args) {
    const result = component.apply(this, args)
    if (component.action === MOUNT) component.action = UPDATE
    return result
  }
}

/**
 * setState 方法，用 component 作为 key 获取对应缓存的 stateList 根据 index 进行值修改
 * @param {function} component 组件方法，作为 componentStateMap 的 key
 * @param {number} setStateIndex 用于确认修改 stateList 哪一项的 index
 * @param {any} value 需要修改的值，如果为函数则调用函数取结果
 * @returns {any} 修改后的值
 */
const setComponentState = (component, setStateIndex, value) => {
  const { stateList, index } = componentStateMap.get(component)
  const prevState = stateList[setStateIndex]
  const nextState = typeof value === 'function' ? value(prevState) : value
  const nextStateList = stateList.slice()
  nextStateList.splice(setStateIndex, 1, nextState)  
  componentStateMap.set(component, { stateList: nextStateList, index })
  return nextState
}

function useState(initialState) {
  // 用 arguments.callee.caller 调用方作为 key 存值
  const caller = arguments.callee.caller

  const { stateList = [], index = 0 } = componentStateMap.get(caller) || {}

  let nextIndex = index

  // MOUNT 初次调用将初始值保存，确定 stateList 长度也就是 useState 调用次数
  if (caller.action === MOUNT) {
    stateList.push(initialState)
  }

  // UPDATE 后续调用需要根据 uesState 调用次数将 index 重置回 0，也就是当 index 大于 stateList 长度时
  if (caller.action === UPDATE) {
    nextIndex = index >= stateList.length ? 0 : index
  }

  // 每次调用时 index + 1 记录下一次调用 useState 对应 stateList 的值 
  componentStateMap.set(caller, { stateList, index: nextIndex + 1 })

  const setState = value => setComponentState(caller, nextIndex, value)

  return [stateList[nextIndex], setState]
}

// example start
const Person = wrap((initialName, initialAge) => {
  const [name, setName] = useState(initialName)
  const [age, setAge] = useState(initialAge)
  console.log(name, age)
  return [setName, setAge]
})

const [setName, setAge] = Person('张三', 18)
Person()

setName('李四')
setAge(36)

Person()
Person()

setName('王五')
setAge(54)

Person()
Person()
// example end
```

Todo

- `arguments.callee.caller` 已废弃，不建议使用，寻找其他方案代替
- 尝试实现 `useEffect` 
