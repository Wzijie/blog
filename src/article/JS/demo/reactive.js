// 当前正在执行的依赖方法
let currentDependentHandler = null

// 当前正在执行的依赖方法的调用栈
let currentDependentHandlerList = []

// 用于保存响应式对象对应的依赖方法，key 为响应式对象，value 为由依赖方法组成的数组
const dependentHandlerListMap = new Map()

/**
 * 返回包装好的依赖方法，用于在依赖方法执行时配合外部变量 currentDependentHandler 能够获取到依赖方法
 * @param {function} fn 依赖方法
 * @return {function} 包装好的依赖方法
 */
function wrap(fn) {
  if (fn.isReactive) return fn

  const reactiveHandler = function (...args) {
    // 设置当前正在执行的依赖方法
    currentDependentHandler = fn

    // 方法执行前入栈
    currentDependentHandlerList.push(fn)

    const returnValue = fn.apply(this, args)

    // 方法执行完毕出栈
    currentDependentHandlerList.pop()

    // 依赖方法执行完毕后将当前正在执行的依赖方法设置为调用栈末尾的依赖方法
    // 目的是为了在嵌套方法场景下保持执行作用域无误，正确进行依赖收集
    currentDependentHandler = currentDependentHandlerList[currentDependentHandlerList.length - 1]

    return returnValue
  }

  // 标记该方法已被包装过
  reactiveHandler.isReactive = true

  return reactiveHandler
}

/**
 * 将普通对象转换成响应式对象
 * @param {object} obj 需要转换成响应式对象的对象
 * @return {object} 经过包装的响应式对象
 */
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
