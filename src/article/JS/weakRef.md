# 确认对象是否被垃圾回收

之前的一次排查内存泄漏是通过控制台的 `Memory` 面板进行的，期间尝试过将对象打印到控制台来确认该对象是否被垃圾回收，但实质上将对象打印到控制台后，就算在代码中解除了对该对象的引用，该对象依然不会被垃圾回收，我的理解是因为控制台需要持续让用户能够浏览到该对象，所以该对象不会被垃圾回收，也就是说控制台保持着对该对象的引用

*当你能观察到该对象时，说明该对象没有被垃圾回收，当你观测不到该对象时，你无法确认该对象是否被垃圾回收 ———— 薛定谔的对象🐈*

## WeakRef

ES2021的提案中，有一个能够用于确认某个对象是否被垃圾回收的 api，那就是 [WeakRef](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)

> WeakRef 对象允许您保留对另一个对象的弱引用，而不会阻止被弱引用对象被 GC 回收

我们来看看如何使用

```javascript
class Test {}

let arr = Array.from({ length: 100000 }, () => new Test())

const ref = new window.WeakRef(arr)

// 解除引用
const dereference = () => { arr = null }

const logWeakRef = () => {
  if (arr) console.log(arr.length)

  // 当 arr 被垃圾回收时，ref.deref() 返回 undefined
  if (ref.deref()) console.log('ref')
}

button1.addEventListener('click', logWeakRef)

button2.addEventListener('click', dereference)
```

`WeakRef` 构造函数接收一个对象，实例有一个 `deref` 方法，会返回构造函数接收到的对象，当该对象已被垃圾回收后，返回 `undefined`

那么我们就可以根据 `deref` 方法是否返回 `undefined` 来确认该对象是否被垃圾回收

在示例中，当我们触发 `logWeakRef` 方法时可以顺利执行 `console.log('ref')`，因为此时 `arr` 被引用未被垃圾回收，当我们解除引用 `arr = null`，再触发 `logWeakRef` 方法时 `console.log('ref')` 未执行，`ref.deref()` 返回 `undefined` 说明 `arr` 对象已被垃圾回收

这里注意如果解除引用后 `ref.deref()` 依然能获取到 `arr` 说明垃圾回收还未进行，可以在控制台 `Memory` 面板中手动触发一次垃圾回收

## FinalizationRegistry

与垃圾回收相关的 api 还有 [FinalizationRegistry](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry)

> FinalizationRegistry 对象可以让你在对象被垃圾回收时请求一个回调

`FinalizationRegistry` 构造函数接收一个回调方法，当一个注册过的对象被垃圾回收时，回调方法会在某个时间点被调用

实例的 `register` 方法用于注册需要监听的对象，该方法入参为

1. `target` 需要注册的对象
2. `heldValue` 回调方法的入参
3. `unregisterToken` 用于解除注册的令牌，可以与 `target` 入参一致，推荐使用 `target`，如不提供该参数则无法解除注册

实例的 `unregister` 方法可用于解除注册过的对象，入参为 `unregisterToken`

我们在上面的示例中使用 `FinalizationRegistry`

```javascript
class Test {}

let arr = Array.from({ length: 100000 }, () => new Test())

const ref = new window.WeakRef(arr)

const dereference = () => { arr = null }

const logWeakRef = () => {
  if (arr) console.log(arr.length)
  if (ref.deref()) console.log('ref')
}

button1.addEventListener('click', logWeakRef)

button2.addEventListener('click', dereference)

const registry = new window.FinalizationRegistry(heldValue => {
  console.log(heldValue)
})

// 解除注册的令牌
const unregisterToken = {}

registry.register(arr, 'arr 已被回收', unregisterToken)

// registry.unregister(unregisterToken) 解除对 arr 的注册监听
```

使用上很简单，当 `arr` 被垃圾回收时，回调方法会触发

但在实际测试中，当 `ref.deref()` 返回 `undefined` 说明 `arr` 已经被垃圾回收，`FinalizationRegistry` 传入的回调方法并没有执行

这在文档中有强调，回调方法会在注册的对象被垃圾回收后的某个时间点触发，或者根本不会触发

并且 `WeakRef` 和 `FinalizationRegistry` 文档中都强调了不建议使用在程序设计中，简单来说就是垃圾回收是不可预测的，不能够依赖垃圾回收机制去实现某些业务功能

我的理解是这两个 api 更多是用于定位排查内存泄漏问题，以及用于实现一些内存监控的工具

至少现在我们可以准确观测一个对象是否被垃圾回收了👀
