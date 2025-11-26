## Backtop 回到顶部

返回页面顶部的操作按钮

### 基础用法

滑动页面即可看到右下方的按钮。
:::demo

```html
<template>
  Scroll down to see the bottom-right button.
  <el-backtop target=".page-component__scroll .el-scrollbar__wrap"></el-backtop>
</template>
```

:::

### 自定义显示内容

显示区域被固定为 40px \* 40px 的区域, 其中的内容可支持自定义。
:::demo

```html
<template>
  Scroll down to see the bottom-right button.
  <el-backtop target=".page-component__scroll .el-scrollbar__wrap" :bottom="100">
    <div
      style="{
        height: 100%;
        width: 100%;
        background-color: #f2f5f6;
        box-shadow: 0 0 6px rgba(0,0,0, .12);
        text-align: center;
        line-height: 40px;
        color: #1989fa;
      }"
    >
      UP
    </div>
  </el-backtop>
</template>
```

:::
