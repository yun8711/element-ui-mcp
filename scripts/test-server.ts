#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["./dist/stdio.js"],
});

const client = new Client({
  name: "element-ui-mcp-client",
  version: "1.0.0",
});

console.log("正在连接 MCP 服务器...");
await client.connect(transport);
console.log("成功连接到 MCP 服务器!");

try {
  // 测试 1: 列出所有组件
  console.log("\n--- 测试 1: 列出所有组件 ---");
  const components = await client.callTool({
    name: "list_components",
    arguments: {},
  });
  Array.isArray(components.content) && console.log(components.content[0].text.substring(0, 200) + "...");

  // 测试 2: 搜索组件
  console.log("\n--- 测试 2: 搜索按钮相关组件 ---");
  const searchResult = await client.callTool({
    name: "search_components",
    arguments: {
      keyword: "button",
      limit: 5,
    },
  });
  Array.isArray(searchResult.content) && console.log(searchResult.content[0].text);

  // 测试 3: 获取组件详情
  console.log("\n--- 测试 3: 获取 el-button 组件详情 ---");
  const componentDetail = await client.callTool({
    name: "get_component",
    arguments: {
      tagName: "el-button",
    },
  });
  Array.isArray(componentDetail.content) && console.log("组件详情获取成功，数据长度:", componentDetail.content[0].text.length);

  // 测试 4: 获取组件属性
  console.log("\n--- 测试 4: 获取 el-button 组件属性 ---");
  const componentProps = await client.callTool({
    name: "get_component_props",
    arguments: {
      tagName: "el-button",
    },
  });
  Array.isArray(componentProps.content) && console.log("组件属性获取成功，数据长度:", componentProps.content[0].text.length);

  // 测试 5: 获取组件事件
  console.log("\n--- 测试 5: 获取 el-button 组件事件 ---");
  const componentEvents = await client.callTool({
    name: "get_component_events",
    arguments: {
      tagName: "el-button",
    },
  });
  Array.isArray(componentEvents.content) && console.log("组件事件获取成功，数据长度:", componentEvents.content[0].text.length);

  // 测试 6: 获取组件示例
  console.log("\n--- 测试 6: 获取 el-button 组件示例 ---");
  const componentExamples = await client.callTool({
    name: "get_component_examples",
    arguments: {
      tagName: "el-button",
    },
  });
  Array.isArray(componentExamples.content) && console.log("组件示例获取成功，数据长度:", componentExamples.content[0].text.length);

  console.log("\n✅ 所有测试完成！");
} catch (error) {
  console.error("测试过程中出错:", error);
} finally {
  // 关闭连接
  await client.close();
  console.log("\n测试完成，已断开与服务器的连接。");
}
