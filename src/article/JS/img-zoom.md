# 图片宽高缩放

## 需求

群里看到的一个题目，提供一个图片宽高数组，一个浏览器宽度，要把所有这些图片放在一行展示且高度一致，你可以等比例缩放图片，输出缩放后的每个图片的宽高

``` javascript
// 例如：
alignItems([[2, 2], [2, 4], [2, 4]], 4);
// 输出
// [[2, 2], [1, 2], [1, 2]]
```

## 解决思路

先满足第一个条件高度一致

先找出最小高度，然后将所有图片高度缩小到该高度，并且等比缩小宽度

``` javascript
const alignItems = (arr, viewWidth) => {
  // 先找出最小高度，然后让大于最小高度的图片宽高等比缩小到最小高度
  const minHeight = Math.min(...arr.map(([width, height]) => height));
  const heightFloorArr = arr.map(([width, height]) => {
    if (height > minHeight) return [width / (height / minHeight), minHeight];
    return [width, height];
  });
}

// [[4, 4], [4, 8], [8, 16]] ===> [[4, 4], [2, 4], [2, 4]]
```

这时候第一个条件高度一致满足了，接着满足第二个条件图片总宽度等于页面宽度

思路就是`图片总宽度 / 页面宽度`得出宽度比，然后所有图片宽高按此比例缩放

完整代码如下

``` javascript
const alignItems = (arr, viewWidth) => {
  // 先找出最小高度，然后让大于最小高度的图片宽高等比缩小到最小高度
  const minHeight = Math.min(...arr.map(([width, height]) => height));
  const heightFloorArr = arr.map(([width, height]) => {
    if (height > minHeight) return [width / (height / minHeight), minHeight];
    return [width, height];
  });

  // 此时如果图片总宽度刚好等于页面宽度则直接返回
  // 否则算出当前图片总宽度与页面宽度的比例，全部图片宽高按此比例缩放
  const imgWidthTotal = heightFloorArr.reduce((prev, [width]) => prev + width, 0);
  if (imgWidthTotal === viewWidth) return heightFloorArr;

  const widthRadio = imgWidthTotal / viewWidth;
  return heightFloorArr.map(([width, height]) => [width / widthRadio, height / widthRadio]);
}

alignItems([[4, 4], [4, 8], [8, 16]], 16);
// [[8, 8], [4, 8], [4, 8]]

alignItems([[4, 4], [4, 8], [8, 16], [10, 20], [10, 40]], 33);
// [[12, 12], [6, 12], [6, 12], [6, 12], [3, 12]]
```
