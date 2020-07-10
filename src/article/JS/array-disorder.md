# 数组乱序

常见的数组乱序是用 `sort` 配合 `Math.random` 来实现

``` javascript
arr.sort(() => Math.random() - 0.5);
```

虽然能达到乱序的效果，但实际测试样本显示每个结果的次数不够平均

这里不用这种方式，自己思考实现一下数组乱序

## 实现思路

我们的目的是随机打乱数组，随机势必要使用到 `Math.random`，关键是使用在哪里，第一个想到的方式是随机取目标数组的值来填充到另一个结果数组，例如

``` javascript
const targetArr = [1, 2, 3];
const resultArr = [];

const randomIndex = Math.floor(Math.random() * targetArr.length);
resultArr.push(targetArr.splice(randomIndex, 1)[0]);
```

从目标数组随机取一个值出来放到结果数组中，直到全部取完为止，并且取值的索引随机生成，根据这个思路具体实现代码如下

``` javascript
const arrayDisorder = arr => {
  // 因为splice方法会改变原数组，所以这里拷贝一份再操作
  const array = arr.slice();

  if (!Array.isArray(arr) || array.length < 2) return;

  return Array.from({ length: array.length })
    .reduce(prev => {
      const randomIndex = Math.floor(Math.random() * array.length);
      return [...prev, array.splice(randomIndex, 1)[0]];
    }, []);
}
```

再写一个方法来测试一下

``` javascript
const check = (arr, length) => {
  return Array.from({ length }).reduce(map => {
    const key = arrayDisorder(arr).join();
    const value = map[key];
    return { ...map, [key]: value ? value + 1 : 1 };
  }, {});
}

check([1, 2, 3], 10000);
// { 1,2,3: 1671, 1,3,2: 1648, 2,1,3: 1701, 2,3,1: 1687, 3,1,2: 1657, 3,2,1: 1636 }
```
