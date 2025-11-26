import componentObject from '../metadata/components.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

/**
 * 获取组件的插槽信息
 * @param server
 */
export function registerGetComponentSlots(server: McpServer) {
  server.registerTool(
    'get_component_slots',
    {
      title: 'Get Component Slots',
      description: '获取 Element-UI 组件的所有插槽（Slots）信息，包括插槽名称、作用域参数、描述等。',
      inputSchema: z.object({
        tagName: z.string().describe('组件标签名, 例如：el-button'),
        slotName: z.string().optional().describe('获取特定插槽的名称，不指定则返回所有插槽'),
      }),
      outputSchema: z.object({
        tagName: z.string().describe('组件标签名'),
        slots: z.array(
          z.object({
            name: z.string().describe('插槽名'),
            description: z.string().optional().describe('插槽描述'),
            parameters: z.array(
              z.object({
                raw: z.string().describe('参数类型'),
              })
            ).optional().describe('作用域插槽的参数'),
            ts: z.string().optional().describe('TypeScript 签名'),
          })
        ),
        total: z.number().describe('插槽总数'),
      }),
    },
    async ({ tagName, slotName }) => {
      const component = componentObject[tagName]

      if (!component) {
        throw new Error(`Component "${tagName}" not found. Available components: ${Object.keys(componentObject).join(', ')}`)
      }

      let resultSlots = component.slots || []

      // 如果指定了插槽名，过滤特定插槽
      if (slotName) {
        resultSlots = resultSlots.filter(slot => slot.name === slotName)
        if (resultSlots.length === 0) {
          throw new Error(`Slot "${slotName}" not found in component "${tagName}". Available slots: ${component.slots?.map(s => s.name).join(', ') || 'none'}`)
        }
      }

      const result = {
        tagName,
        slots: resultSlots,
        total: (component.slots || []).length,
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
