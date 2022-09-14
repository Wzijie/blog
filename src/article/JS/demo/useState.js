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
