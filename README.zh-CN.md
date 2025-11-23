# Element-UI MCP Server

[![English](https://img.shields.io/badge/Language-English-green)](README.md)

一个模型上下文协议 (MCP) 服务器，提供有关 Element-UI v2.15.14 组件的全面信息。该服务器使 AI 助手能够查询 Element-UI 组件文档、属性、事件和使用示例。

## 项目介绍

Vue.js 是一个极其强大的前端框架，而 Element-UI 则是 Vue 2 时代最受欢迎、最成熟的 UI 组件库之一。
尽管如今 vue 生态已经进入 Vue 3 时代，Element-UI 的最后一次提交都是2023年8月24日的事了，但仍有大量项目基于 Vue 2 + Element-UI 继续维护、迭代。

为了让大模型在阅读、生成和补全代码时能够更精准地理解 Element-UI 的组件、属性、事件与示例，并进一步提升我们在旧项目维护中的开发效率，我参考了其他优秀组件库的实践，构建了这个 Element-UI 专用 MCP Server。

希望它能在你的日常开发中派上用场，也为继续维护 Vue2 项目的同学节省更多时间。



## 功能特性

- 📋 **列出组件** - 获取所有 Element-UI 组件的完整列表
- 🔍 **搜索组件** - 按名称或描述搜索组件
- 📖 **组件详情** - 获取特定组件的详细信息
- ⚙️ **组件属性** - 访问组件的所有属性、类型和默认值
- 🎯 **组件事件** - 查看所有事件及其参数
- 📝 **使用示例** - 从组件文档中提取代码示例

## API

该服务器提供 6 个 MCP API：

### 1. `list_components`
列出所有可用的 Element-UI 组件。

### 2. `search_components`
按关键词搜索组件。

**参数：**
- `keyword`: 搜索词
- `limit` (可选): 最大结果数量

### 3. `get_component`
获取特定组件的详细信息。

**参数：**
- `tagName`: 组件标签名称 (例如: "el-button")

### 4. `get_component_props`
获取特定组件的所有属性。

**参数：**
- `tagName`: 组件标签名称
- `propName` (可选): 特定属性名称

### 5. `get_component_events`
获取特定组件的所有事件。

**参数：**
- `tagName`: 组件标签名称
- `eventName` (可选): 特定事件名称

### 6. `get_component_examples`
获取特定组件的使用示例。

**参数：**
- `tagName`: 组件标签名称
- `exampleIndex` (可选): 特定示例的索引

## MCP 集成

要将此服务器与兼容 MCP 的客户端一起使用，有两种配置方式：

### 方式一：本地安装
如果你已经克隆并构建了项目：

```json
{
  "mcpServers": {
    "element-ui": {
      "command": "node",
      "args": ["/path/to/element-ui-mcp/stdio.js"]
    }
  }
}
```

### 方式二：全局安装（推荐）
全局安装包并使用 npx：

```bash
npm install -g element-ui-mcp
```

然后在 MCP 客户端中配置：

```json
{
  "mcpServers": {
    "element-ui": {
      "command": "npx",
      "args": ["-y", "element-ui-mcp"]
    }
  }
}
```

推荐使用 npx 方式，它会自动管理包版本并确保使用最新版本。

## 数据来源

组件数据是从 Element-UI v2.15.14 文档和类型定义中提取的，包括：

- 组件属性和类型
- 事件定义
- 文档中的使用示例
- TypeScript 定义

## 许可证

MIT
