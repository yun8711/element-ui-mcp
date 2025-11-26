import componentObject from '../metadata/components.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

/**
 * 搜索 element-ui组件
 * @param server
 */
export function registerSearchComponents(server: McpServer) {
  server.registerTool(
    'search_components',
    {
      title: 'Search Element-UI Components',
      description:
        '根据关键词搜索 Element-UI 组件库中的组件。支持在组件名和描述中进行模糊匹配。',
      inputSchema: z.object({
        keyword: z.string().describe('搜索关键词'),
        limit: z.number().optional().describe('返回结果的最大数量，默认返回所有匹配结果'),
      }),
      outputSchema: z.object({
        components: z.array(
          z.object({
            tagName: z.string().describe('组件标签名, 例如：el-button'),
            description: z.string().describe('组件描述'),
            docUrl: z.string().url().describe('组件文档URL'),
          })
        ),
        total: z.number().describe('匹配到的组件总数'),
      }),
    },
    async ({ keyword, limit }) => {
      const components = Object.values(componentObject)

      // 搜索匹配的组件
      const matchedComponents = components.filter(component => {
        const nameMatch = component.tagName.toLowerCase().includes(keyword.toLowerCase())
        const descMatch = component.description && component.description.toLowerCase().includes(keyword.toLowerCase())
        return nameMatch || descMatch
      })

      // 按标签名排序
      matchedComponents.sort((a, b) => a.tagName.localeCompare(b.tagName))

      // 限制返回数量
      const resultComponents = limit ? matchedComponents.slice(0, limit) : matchedComponents

      const list = resultComponents.map(component => ({
        tagName: component.tagName,
        description: component.description,
        docUrl: component.docUrl,
      }))

      return {
        structuredContent: {
          components: list,
          total: matchedComponents.length,
        },
        content: [
          {
            type: 'text' as const,
            text: `找到 ${matchedComponents.length} 个匹配的组件${limit && matchedComponents.length > limit ? `（显示前 ${limit} 个）` : ''}：\n\n${JSON.stringify({ components: list, total: matchedComponents.length }, null, 2)}`,
          },
        ],
      }
    }
  )
}
