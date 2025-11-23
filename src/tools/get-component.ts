import componentObject from '../data/components.json'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 获取某个 element-ui组件的详细信息
 * @param server
 */
export function registerGetComponent(server: McpServer) {
  server.registerTool(
    'get_component',
    {
      title: 'Get Element-UI Component',
      description:
        '获取 Element-UI 组件库中某个组件的详细信息。返回：含前缀的标签名（tagName）、描述（description）、文档 URL（documentation URL）、属性（props）、事件（events）、插槽（slots）、示例代码（example）、类型定义（dts）。',
      inputSchema: z.object({
        tagName: z.string().describe('组件标签名, 例如：el-button'),
      }),
      outputSchema: z.object({
        tagName: z.string().describe('组件标签名, 例如：el-button'),
        description: z.string().describe('组件描述'),
        docUrl: z.string().url().describe('组件文档URL'),
        props: z.any().describe('组件属性列表'),
        events: z.any().describe('组件事件列表'),
        slots: z.any().describe('组件插槽列表'),
        docContent: z.string().describe('组件文档内容'),
        dts: z.string().describe('组件的TypeScript类型定义'),
      }),
    },
    async ({ tagName }) => {
      const component = componentObject.components[tagName]

      if (!component) {
        throw new Error(`Component "${tagName}" not found. Available components: ${Object.keys(componentObject.components).join(', ')}`)
      }

      // 读取示例代码（MD文件）
      let docContent = ''
      try {
        const mdPath = path.join(__dirname, '../data/docs', `${tagName}.md`)
        if (fs.existsSync(mdPath)) {
          docContent = fs.readFileSync(mdPath, 'utf8')
        }
      } catch (error) {
        console.warn(`Failed to read docContent for ${tagName}:`, error)
      }

      // 读取类型定义（DTS文件）
      let dts = ''
      try {
        const dtsPath = path.join(__dirname, '../data/docs', `${tagName}.d.ts`)
        if (fs.existsSync(dtsPath)) {
          dts = fs.readFileSync(dtsPath, 'utf8')
        }
      } catch (error) {
        console.warn(`Failed to read dts for ${tagName}:`, error)
      }

      const result = {
        tagName: component.name,
        description: component.description,
        docUrl: component.docUrl,
        props: component.props || [],
        events: component.events || [],
        slots: component.slots || [],
        docContent,
        dts: dts,
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
