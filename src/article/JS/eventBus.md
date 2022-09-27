# 事件总线设计

本文记录一下如何设计一个事件总线工具

## 基本要求

事件总线有基本的监听、卸载监听、多重监听、触发等基本功能，可以传递参数

例如

```javascript
const bus = new Bus()

bus.listen('testEvent', (...args) => { 
  console.log('event callback')
})

bus.trigger('testEvent', 1, 2)
```

要求不难，可以很快出一个初版

```javascript
class Bus {
  constructor() {
    this.listenEventMap = {}
  }

  listen(eventName, handler) {
    const eventList = this.listenEventMap[eventName] || []
    this.listenEventMap[eventName] = [...eventList, handler]
  }

  trigger(eventName, ...args) {
    const eventList = this.listenEventMap[eventName] || []
    eventList.forEach(handler => handler(...args))
  }

  remove(eventName, handler) {
    const eventList = this.listenEventMap[eventName]
    if (!eventList) return
    this.listenEventMap[eventName] = handler
      ? eventList.filter(item => handler === item)
      : []
  }
}
```

首先 `listen` 方法将事件记录起来供后续调用，以数组方式储存支持多重监听

`trigger` 方法触发事件就是将保存过的方法取出来遍历调用

`remove` 方法用给定的方法名将保存过的事件回调移除，可以提供具体的事件回调以支持移除单个回调方法

## 增加功能

我们需要输出事件调用栈(树形)，并且检测无限循环调用事件，也就是说在事件回调中存在继续触发事件

例如

```javascript
bus.listen('testEvent', function callback1(){
  // do something
  this.trigger('testEvent2')
})

bus.listen('testEvent2', function callback2(){
    // do something
})

bus.trigger('testEvent')
/** 设计 api 和数据结构并打印出这次 trigger 内部所有发生的事件和监听信息
 * 期望得到的结果是一个树形结构，描述着触发的事件、事件的响应函数以及响应函数中再触发的事件。例如：
 * event: testEvent
 *   |-callback: callback1
 *      |-event: testEvent2
 *          |--callback: callback2
 * 
 * 注意，bus.trigger 应该可以执行多次，每一次trigger 都应该得到一个独立的事件栈。
 */
```

首先是如何保存调用栈，以上面的代码举例，`bus.trigger('testEvent')` 调用后调用栈为 

```javascript
[{ event: 'testEvent', callback: callback1 }]

// this.trigger('testEvent2') 触发

[{
  event: 'testEvent',
  callback: callback1,
  children: [{
    event: 'testEvent2',
    callback: callback2,
  }],
}]
```

我们需要在 `bus.trigger` 调用时表示开始记录调用栈，内部 `this.trigger` 调用时延续之前的调用栈

这里关键点在于区分外部调用与内部调用的的 `trigger` 方法

```javascript
class Bus {
  constructor() {
    this.listenEventMap = {}
  }

  callHandler(stackList, parentStack, eventName, ...args) {
    const eventList = this.listenEventMap[eventName] || []

    eventList.forEach(handler => {
      const stack = { event: eventName, callback: handler, parent: parentStack }

      // 延续调用栈
      stackList.push(stack)

      // 重写 trigger 方法
      const subSelf = {
        ...this,
        trigger: (...args) => {
          this.subTrigger(stackList, stack, ...args)
        },
      }

      handler.call(subSelf, ...args)
    })

    return stackList
  }

  trigger(eventName, ...args) {
    const stackList = this.callHandler([], null, eventName, ...args)
    return stackList
  }

  subTrigger(stackList, parentStack, eventName, ...args) {
    this.callHandler(stackList, parentStack, eventName, ...args)
  }

  remove(eventName, handler) {
    const eventList = this.listenEventMap[eventName]
    if (!eventList) return
    this.listenEventMap[eventName] = handler
      ? eventList.filter(item => handler === item)
      : []
  }
}
```

这里新增了两个方法

`callHandler` 负责调用事件回调，生成调用栈对象并延续调用栈列表，重写了事件回调 this 对象的 trigger 方法，事件回调中再次触发事件走 subTrigger 方法

`subTrigger` 上面提到了这个方法就是用来区分外部调用的 trigger 方法，入参 `stackList` `parentStack` 由 `callHandler` 方法预置以延续调用栈

我们通过重写内部触发事件方法 `trigger` ===> `subTrigger` 预置参数调用栈列表 `stackList` 以及父级调用栈对象 `parentStack`，达到延续调用栈的目的，外部调用 `trigger` 设置初始调用栈，内部 `subTrigger` 延续调用栈，保存 `parentStack` 父级调用栈对象是方便我们接下来实现检测无限循环调用事件

接下来实现检测无限循环调用事件方法，上面提到了主要通过父级调用栈来实现，成熟的人已经开始抢答了🙋‍♂️

```javascript
checkCircularCall(parentStack, eventName) {
  while (parentStack && parentStack.parent) {
    if (parentStack.parent.event === eventName) {
      throw new Error(`事件：${eventName} 存在循环调用`)
    }
    parentStack = parentStack.parent
  }
}
```

每个调用栈对象都保存了完整的父级调用栈对象，那么只要通过向上层查找，如果上层出现了当前调用事件则可以认为存在循环调用

最终要输出的调用栈要求为树形，提供一个方法将 `stackList` 调用栈列表转为 `stackTree` 树形结构

```javascript
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
```

输出事件调用栈以及检测无限循环调用事件功能就完成了

## 终极挑战:歌利亚

增加对 async callback 的支持，并要求仍然能够正确打印出调用栈，调用 callback 时，如果碰到 async callback，正常调用，不要阻塞，在 async callback 中再触发的 event 要在事件栈中的正确位置

```javascript
bus.listen('testEvent', async function callback1(){
  // do something
  return new Promise((resolve) => {
    setTimeout(() => {
          this.trigger('asyncEvent1')
          resolve()
    }, 1000)
  })
})

bus.listen('testEvent', async function callback2(){
  // do something
  this.trigger('testEvent2')
})

bus.listen('testEvent2', async function callback3(){
  // do something
  return new Promise((resolve) => {
    setTimeout(() => {
          this.trigger('asyncEvent3')
          resolve()
    }, 2000)
  })
})

/*
 * 期望得到的结果：
 * event: testEvent
 *   |-callback: callback1
 *      |-event: asyncEvent1
 *   |-callback: callback2
 *      |-event: testEvent2
 *          |-callback: callback3
 *              |-event: asyncEvent3
 */
```

这里有两种方案

第一种是 `trigger` 方法改为异步返回，在所有异步事件回调都执行完毕确定最终的调用栈后再返回结果

第二种是 `trigger` 方法依然同步返回，但此时调用栈仅为同步事件回调构成，额外返回一个方法，可以注册监听方法用于监听异步任务消费，每当有异步事件回调任务被消费掉时都会触发给定的监听方法

例如

```javascript
const { stackTree, subscribeObserverAsync } = bus.trigger('testEvent')
subscribeObserverAsync(stackTree => {
  // 调用栈更新
})
```

我倾向于第二种方案，可以立即获得一个同步任务构成的调用栈，并且想要获得更完整的调用栈时也能通过观察器拿到，相比第一种方案更灵活

异步任务观察器的实现思路大致是

- 保存通过 `subscribeObserverAsync` 注册的监听回调
- 调用事件回调时保存回调执行结果也就是异步任务
- 事件触发后开始消费异步任务，每消费完一个异步任务就执行由 subscribeObserverAsync 注册的回调

```javascript
class Bus {
  constructor() {
    this.listenEventMap = {}
    // 存放异步事件回调任务
    this.asyncTaskListMap = {}
    // 新增存放观察异步任务消费的回调方法
    this.observerAsyncCallback = {}
  }

  // 注册观察任务消费回调方法，如果异步任务已消费完则立即执行回调
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

  // 负责消费异步任务，每消费完一个异步任务就执行由 subscribeObserverAsync 注册的回调
  async dispatchObserver(asyncTaskId) {
    while (this.asyncTaskListMap[asyncTaskId].length > 0) {
      const stackList = await this.asyncTaskListMap[asyncTaskId].shift()

      const complete = this.asyncTaskListMap[asyncTaskId].length === 0

      const callbackList = this.observerAsyncCallback[asyncTaskId]

      if (callbackList) {
        callbackList.forEach(handler => handler(this.getStackTree(stackList), complete))
      }
    }
    
    // 标记异步任务已消费完毕
    this.asyncTaskListMap[asyncTaskId].complete = true
  }

  callHandler(stackList, parentStack, asyncTaskId, eventName, ...args) {
    const eventList = this.listenEventMap[eventName] || []

    eventList.forEach(handler => {
      const stack = { event: eventName, callback: handler, parent: parentStack }

      // 延续调用栈
      stackList.push(stack)

      // 重写 trigger 方法
      const subSelf = {
        ...this,
        trigger: (...args) => {
          this.subTrigger(stackList, stack, asyncTaskId, ...args)
        },
      }

      const callbackResult = handler.call(subSelf, ...args)

      // 保存异步任务
      this.asyncTaskListMap[asyncTaskId].push(new Promise(async resolve => {
        await callbackValue
        resolve(stackList)
      }))
    })

    return stackList
  }

  trigger(eventName, ...args) {
    // 生成异步任务唯一ID标记初始异步任务
    const asyncTaskId = Math.random().toString(16).slice(2)

    this.asyncTaskListMap[asyncTaskId] = []

    // 开始执行回调后会不断的将回调结果也就是异步任务存入 asyncTaskListMap 异步任务列表
    const stackList = this.callHandler([], null, asyncTaskId, eventName, ...args)

    // 执行回调后马上开始消费异步任务，并且每消费完一个异步任务就执行由 subscribeObserverAsync 注册的回调
    // 当异步任务消费完不再有新任务加入时，表示当前事件回调已全部执行完毕，此时可以取得完整调用栈
    // 如果当 subscribeObserverAsync 注册回调时异步任务已经消费完毕则直接执行回调无需注册
    this.dispatchObserver(asyncTaskId)

    return {
      stackList,
      subscribeObserverAsync: this.subscribeObserverAsync(asyncTaskId, stackList),
    }
  }

  subTrigger(stackList, parentStack, asyncTaskId, eventName, ...args) {
    this.callHandler(stackList, parentStack, asyncTaskId, eventName, ...args)
  }
}
```

我们新增了两个属性分别是

- `asyncTaskListMap` 用于存放异步事件回调任务
- `observerAsyncCallback` 用于存放观察异步任务消费的回调方法

入口 `trigger` 方法，这里生成了异步任务ID，主要是用于标记当前调用产生的异步任务，并且设置了一个初始异步任务，这个ID作为 `asyncTaskListMap` `observerAsyncCallback` 的 key

`callHandler` 开始执行回调后会不断的将回调结果也就是异步任务存入 `asyncTaskListMap` 异步任务列表

`callHandler` 执行回调后马上调用 `dispatchObserver` 开始消费异步任务，并且每消费完一个异步任务就执行由 `subscribeObserverAsync` 注册的回调，当异步任务消费完不再有新任务加入时，表示当前事件回调已全部执行完毕，此时可以取得完整调用栈

而 `subscribeObserverAsync` 会由 `trigger` 事件触发入口返回，用于注册异步任务消费回调，回调存放在 `observerAsyncCallback`，注册回调时异步任务已经消费完毕则直接执行回调无需注册

到这里就完成了对异步任务调用栈的支持

全剧终🎊

完整代码 [eventBus.js](https://github.com/Wzijie/blog/blob/master/src/article/JS/demo/eventBus.js)

```javascript
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

```
