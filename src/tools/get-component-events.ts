import componentObject from '../metadata/components.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

/**
 * 获取组件的事件信息
 * @param server
 */
export function registerGetComponentEvents(server: McpServer) {
  server.registerTool(
    'get_component_events',
    {
      title: 'Get Component Events',
      description: '获取 Element-UI 组件的所有事件（Events）信息，包括事件名称、描述、参数等。',
      inputSchema: z.object({
        tagName: z.string().describe('组件标签名, 例如：el-button'),
        eventName: z.string().optional().describe('获取特定事件的名称，不指定则返回所有事件'),
      }),
      outputSchema: z.object({
        tagName: z.string().describe('组件标签名'),
        events: z.array(
          z.object({
            name: z.string().describe('事件名'),
            description: z.string().optional().describe('事件描述'),
            parameters: z.array(
              z.object({
                raw: z.string().describe('参数类型'),
              })
            ).optional().describe('事件参数'),
            ts: z.string().optional().describe('TypeScript 签名'),
          })
        ),
        total: z.number().describe('事件总数'),
      }),
    },
    async ({ tagName, eventName }) => {
      const component = componentObject[tagName]

      if (!component) {
        throw new Error(`Component "${tagName}" not found. Available components: ${Object.keys(componentObject).join(', ')}`)
      }

      let resultEvents = component.events || []

      // 如果指定了事件名，过滤特定事件
      if (eventName) {
        resultEvents = resultEvents.filter(event => event.name === eventName)
        if (resultEvents.length === 0) {
          throw new Error(`Event "${eventName}" not found in component "${tagName}". Available events: ${component.events?.map(e => e.name).join(', ') || 'none'}`)
        }
      }

      const result = {
        tagName,
        events: resultEvents,
        total: (component.events || []).length,
      }

      return {
        structuredContent: result,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      }
    }
  )
}
