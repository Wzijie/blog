# 斐波那契数列实现

用自己习惯的方式遍历来实现一下斐波那契

## 常见递归版本

常见的递归实现

``` javascript
const fibonacci = num => {
  if (num === 1 || num === 2) return 1;
  return fibonacci(num - 1) + fibonacci(num - 2);
}

fibonacci(6); // 8
```

## 遍历实现

斐波那契数列`1, 1, 2, 3, 5, 8`即每一项数字等于前两项之和，且开头两项固定为1，基于这个需求来实现

``` javascript
const fibonacci = length => {
  return Array.from({ length }).reduce((prev, current, index) => {
    // 第一项和第二项固定为1，其余项为当前index的前两项之和
    const nextNum = index === 0 || index === 1
      ? 1
      : prev[index - 1] + prev[index - 2];
    return [...prev, nextNum];
  }, []);
}

fibonacci(6); // [1, 1, 2, 3, 5, 8]

fibonacci(10); // [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
```
