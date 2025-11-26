import componentObject from '../metadata/components.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 获取组件的使用示例
 * @param server
 */
export function registerGetComponentExamples(server: McpServer) {
  server.registerTool(
    'get_component_examples',
    {
      title: 'Get Component Examples',
      description: '获取 Element-UI 组件的具体使用示例。直接返回过滤后的文档内容。',
      inputSchema: z.object({
        tagName: z.string().describe('组件标签名, 例如：el-button'),
      }),
      outputSchema: z.object({
        tagName: z.string().describe('组件标签名'),
        content: z.string().describe('过滤后的文档内容，包含组件描述和使用示例'),
      }),
    },
    async ({ tagName }) => {
      const component = componentObject[tagName]

      if (!component) {
        throw new Error(`Component "${tagName}" not found. Available components: ${Object.keys(componentObject).join(', ')}`)
      }

      // 读取过滤后的文档内容
      let content = ''
      try {
        const mdPath = path.join(__dirname, '../examples', `${tagName}.md`)
        if (fs.existsSync(mdPath)) {
          content = fs.readFileSync(mdPath, 'utf8')
        } else {
          content = `未找到 ${tagName} 组件的示例文档。`
        }
      } catch (error) {
        console.warn(`Failed to read examples for ${tagName}:`, error)
        content = `读取 ${tagName} 组件示例文档时出错。`
      }

      console.log('content',content)

      const result = {
        tagName,
        content,
      }

      return {
        structuredContent: result,
        content: [
          {
            type: 'text' as const,
            text: content,
          },
        ],
      }
    }
  )
}
