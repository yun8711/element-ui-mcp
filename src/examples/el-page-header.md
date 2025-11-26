## PageHeader 页头

如果页面的路径比较简单，推荐使用页头组件而非面包屑组件。

### 基础

:::demo
```html
<el-page-header @back="goBack" content="详情页面">
</el-page-header>

<script>
  export default {
    methods: {
      goBack() {
        console.log('go back');
      }
    }
  }
</script>
```
:::
