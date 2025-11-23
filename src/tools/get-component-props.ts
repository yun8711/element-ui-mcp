import componentObject from '../data/components.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

/**
 * 获取组件的属性信息
 * @param server
 */
export function registerGetComponentProps(server: McpServer) {
  server.registerTool(
    'get_component_props',
    {
      title: 'Get Component Props',
      description: '获取 Element-UI 组件的所有属性（Props）信息，包括名称、类型、描述、默认值等。',
      inputSchema: z.object({
        tagName: z.string().describe('组件标签名, 例如：el-button'),
        propName: z.string().optional().describe('获取特定属性的名称，不指定则返回所有属性'),
      }),
      outputSchema: z.object({
        tagName: z.string().describe('组件标签名'),
        props: z.array(
          z.object({
            name: z.string().describe('属性名'),
            description: z.string().optional().describe('属性描述'),
            type: z.object({
              raw: z.string().describe('属性类型'),
            }).describe('属性类型信息'),
            required: z.boolean().optional().describe('是否必需'),
            default: z.any().optional().describe('默认值'),
          })
        ),
        total: z.number().describe('属性总数'),
      }),
    },
    async ({ tagName, propName }) => {
      const component = componentObject[tagName]

      if (!component) {
        throw new Error(`Component "${tagName}" not found. Available components: ${Object.keys(componentObject).join(', ')}`)
      }

      let resultProps = component.props || []

      // 如果指定了属性名，过滤特定属性
      if (propName) {
        resultProps = resultProps.filter(prop => prop.name === propName)
        if (resultProps.length === 0) {
          throw new Error(`Property "${propName}" not found in component "${tagName}". Available props: ${component.props?.map(p => p.name).join(', ') || 'none'}`)
        }
      }

      const result = {
        tagName,
        props: resultProps,
        total: (component.props || []).length,
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
