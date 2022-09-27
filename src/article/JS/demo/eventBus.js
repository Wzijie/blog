class Bus {
  constructor() {
    // 存放所有注册过的事件，以数组形式存放回调方法用于支持一个事件多个回调
    this.listenEventMap = {}
    // 存放异步事件回调任务
    this.asyncTaskListMap = {}
    // 存放观察异步任务消费的回调方法
    this.observerAsyncCallback = {}
  }

  /**
   * 注册事件
   * @param {string} eventName 事件名
   * @param {function} handler 回调方法
   */
  listen(eventName, handler) {
    const eventList = this.listenEventMap[eventName] || []
    this.listenEventMap[eventName] = [...eventList, handler]
  }

  /**
   * 注册观察任务消费回调方法，如果异步任务已消费完则立即执行回调
   * @param {string} asyncTaskId 标识异步任务的唯一ID
   * @returns {function} 返回一个观察器方法，参数为监听异步任务消费的回调方法
   */
  subscribeObserverAsync(asyncTaskId, stackList) {
    return callback => {
      // 如果异步任务已消费完则立即执行回调
      if (this.asyncTaskListMap[asyncTaskId].complete) {
        return callback(this.getStackTree(stackList), true)
      }

      const callbackList = this.observerAsyncCallback[asyncTaskId] || []

      this.observerAsyncCallback[asyncTaskId] = [...callbackList, callback]
    }
  }

  /**
   * 负责消费异步任务，每消费完一个异步任务就执行由 subscribeObserverAsync 注册的回调
   * @param {string} asyncTaskId 标识异步任务的唯一ID
   */
  async dispatchObserver(asyncTaskId) {
    while (this.asyncTaskListMap[asyncTaskId].length > 0) {
      const stackList = await this.asyncTaskListMap[asyncTaskId].shift()

      const complete = this.asyncTaskListMap[asyncTaskId].length === 0

      const callbackList = this.observerAsyncCallback[asyncTaskId]

      if (callbackList) {
        callbackList.forEach(handler => handler(this.getStackTree(stackList), complete))
      }
    }

    // 当 asyncTaskListMap 列表为空则标记异步任务已消费完毕
    this.asyncTaskListMap[asyncTaskId].complete = true
  }

  /**
   * 检查循环调用，从父级逐层向上查找，如果上层调用栈出现了当前调用事件则认为存在循环调用
   * @param {object} parentStack 父级调用栈对象
   * @param {string} eventName 当前调用的事件名
   */
  checkCircularCall(parentStack, eventName) {
    while (parentStack && parentStack.parent) {
      if (parentStack.parent.event === eventName) {
        throw new Error(`事件：${eventName} 存在循环调用`)
      }
      parentStack = parentStack.parent
    }
  }

  /**
   * 将 stackList 调用栈列表转为 stackTree 树形结构
   * @param {array} stackList 调用栈列表
   * @returns {array} stackTree 树
   */
  getStackTree(stackList) {
    const result = []

    stackList.forEach(item => {
      item.id = Math.random().toString(16).slice(2)
      if (item.parent) item.pid = item.parent.id
    })

    const map = stackList.reduce((prev, current) => {
      return { ...prev, [current.id]: { ...current, children: [] } }
    }, {})

    stackList.forEach(item => {
      const { id, pid } = item

      if (!pid) result.push(map[id])

      if (map[pid]) map[pid].children.push(map[id])
    })

    return result
  }

  /**
   * 执行事件回调
   * @param {array} stackList 调用栈
   * @param {object} parentStack 父级调用栈对象
   * @param {string} asyncTaskId 标识异步任务的唯一ID
   * @param {string} eventName 事件名
   * @param  {...any} args 事件回调入参
   * @returns {array} 同步任务调用栈
   */
  callHandler(stackList, parentStack, asyncTaskId, eventName, ...args) {
    const eventList = this.listenEventMap[eventName] || []

    eventList.forEach(handler => {
      // 检测循环调用
      this.checkCircularCall(parentStack, eventName)

      // 生成调用栈对象并 push 到调用栈列表
      const stack = { event: eventName, callback: handler, parent: parentStack }

      stackList.push(stack)

      // 重写子事件回调中 this 的 trigger 方法
      const subSelf = {
        ...this,
        trigger: (...args) => {
          this.subTrigger(stackList, stack, asyncTaskId, ...args)
        },
      }

      const callbackValue = handler.call(subSelf, ...args)

      // 保存异步任务
      this.asyncTaskListMap[asyncTaskId].push(new Promise(async resolve => {
        await callbackValue
        resolve(stackList)
      }))
    })

    return stackList
  }

  /**
   * 外部触发事件
   * @param {string} eventName 事件名
   * @param  {...any} args 
   * @returns {object} 返回 { stackTree, subscribeObserverAsync }
   *   stackTree 为同步任务调用栈
   *   subscribeObserverAsync 异步任务观察器，参数为监听异步任务消费的回调方法
   */
  trigger(eventName, ...args) {
    // 生成异步任务唯一ID
    const asyncTaskId = Math.random().toString(16).slice(2)

    this.asyncTaskListMap[asyncTaskId] = []

    // 开始执行回调后会不断的将回调结果也就是异步任务存入 asyncTaskListMap 异步任务列表
    const stackList = this.callHandler([], null, asyncTaskId, eventName, ...args)

    // 执行回调后马上开始消费异步任务，并且每消费完一个异步任务就执行由 subscribeObserverAsync 注册的回调
    // 当异步任务消费完不再有新任务加入时，表示当前事件回调已全部执行完毕，此时可以取得完整调用栈
    // 如果当 subscribeObserverAsync 注册回调时异步任务已经消费完毕则直接执行回调无需注册
    this.dispatchObserver(asyncTaskId)

    const stackTree = this.getStackTree(stackList)

    return {
      stackTree,
      subscribeObserverAsync: this.subscribeObserverAsync(asyncTaskId, stackList),
    }
  }

  /**
   * 内部触发事件
   * @param {array} stackList 调用栈
   * @param {object} parentStack 父级调用栈对象
   * @param {string} asyncTaskId 标识异步任务的唯一ID
   * @param {string} eventName 事件名
   * @param  {...any} args 事件回调入参
   */
  subTrigger(stackList, parentStack, asyncTaskId, eventName, ...args) {
    this.callHandler(stackList, parentStack, asyncTaskId, eventName, ...args)
  }

  /**
   * 移除事件，若提供回调则只移除对应的回调方法，否则移除所有回调方法
   * @param {string} eventName 事件名
   * @param {function?} handler 回调方法
   */
  remove(eventName, handler) {
    const eventList = this.listenEventMap[eventName]
    if (!eventList) return
    this.listenEventMap[eventName] = handler
      ? eventList.filter(item => handler === item)
      : []
  }
}

export default Bus

/* example
const bus = new Bus()

bus.listen('testEvent', async function callback1() {
  // do something
  return new Promise((resolve) => {
    setTimeout(() => {
      this.trigger('testEvent2')
      resolve('1')
    }, 3000)
  })
})

bus.listen('testEvent2', async function callback3() {
  // do something
  return new Promise((resolve) => {
    setTimeout(() => {
      this.trigger('asyncEvent1')
      resolve('2')
    }, 3000)
  })
})

bus.listen('asyncEvent1', async function callback4() {
  // do something
  return new Promise((resolve) => {
    setTimeout(() => {
      this.trigger('asyncEvent3')
      resolve('3')
    }, 3000)
  })
})

bus.listen('asyncEvent3', async function callback5() {
  // do something
})

const { stackTree, subscribeObserverAsync } = bus.trigger('testEvent')

subscribeObserverAsync((asyncStackTree, stackComplete) => {
  console.log(asyncStackTree, '异步调用栈')
  console.log(stackComplete, '事件回调是否全部调用完毕')
})

console.log(stackTree, '同步调用栈')
*/
