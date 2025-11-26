import componentObject from '../metadata/components.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

/**
 * 获取组件的方法信息
 * @param server
 */
export function registerGetComponentMethods(server: McpServer) {
  server.registerTool(
    'get_component_methods',
    {
      title: 'Get Component Methods',
      description: '获取 Element-UI 组件的所有方法（Methods）信息，包括方法名称、参数、返回值等。',
      inputSchema: z.object({
        tagName: z.string().describe('组件标签名, 例如：el-button'),
        methodName: z.string().optional().describe('获取特定方法的名称，不指定则返回所有方法'),
      }),
      outputSchema: z.object({
        tagName: z.string().describe('组件标签名'),
        methods: z.array(
          z.object({
            name: z.string().describe('方法名'),
            description: z.string().optional().describe('方法描述'),
            parameters: z.array(
              z.object({
                raw: z.string().describe('参数类型'),
              })
            ).optional().describe('方法参数'),
            returnType: z.object({
              raw: z.string().describe('返回值类型'),
            }).optional().describe('返回值类型'),
            ts: z.string().optional().describe('TypeScript 签名'),
          })
        ),
        total: z.number().describe('方法总数'),
      }),
    },
    async ({ tagName, methodName }) => {
      const component = componentObject[tagName]

      if (!component) {
        throw new Error(`Component "${tagName}" not found. Available components: ${Object.keys(componentObject).join(', ')}`)
      }

      let resultMethods = component.methods || []

      // 如果指定了方法名，过滤特定方法
      if (methodName) {
        resultMethods = resultMethods.filter(method => method.name === methodName)
        if (resultMethods.length === 0) {
          throw new Error(`Method "${methodName}" not found in component "${tagName}". Available methods: ${component.methods?.map(m => m.name).join(', ') || 'none'}`)
        }
      }

      const result = {
        tagName,
        methods: resultMethods,
        total: (component.methods || []).length,
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
