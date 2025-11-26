import componentObject from '../metadata/components.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

/**
 * 列出所有 element-ui组件
 * @param server
 */
export function registerListComponents(server: McpServer) {
  server.registerTool(
    'list_components',
    {
      title: 'List Element-UI Components',
      description:
        '列出 Element-UI 组件库中所有可用的组件。每个条目返回：含前缀的标签名（tagName）、描述（description）、文档 URL（documentation URL）。结果按标签名（升序）排序。',
      inputSchema: {},
      outputSchema: {
        components: z
          .array(
            z.object({
              tagName: z.string().describe('组件标签名, 例如：el-button'),
              description: z.string().describe('组件描述'),
              docUrl: z.string().url().describe('组件文档URL'),
            })
          )
          .describe(
            '一份包含组件及其标签名称、描述、文档 URL 的列表（按标签名称排序）。'
          ),
      },
    },
    async () => {
      const components = Object.values(componentObject)
      const list = components.map(component => ({
        tagName: component.tagName,
        description: component.description,
        docUrl: component.docUrl,
      }))

      return {
        structuredContent: { components: list },
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ components: list }, null, 2),
          },
        ],
      }
    }
  )
}
