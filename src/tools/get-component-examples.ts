import componentObject from '../data/components.json'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 解析 markdown 文件中的示例代码块
 * @param markdownContent markdown 内容
 * @returns 解析出的示例列表
 */
function parseExamples(markdownContent: string) {
  const examples: Array<{ title: string; description: string; code: string }> = []

  // 按 :::demo 分割内容
  const sections = markdownContent.split(':::demo')

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i]
    const endIndex = section.indexOf(':::')

    if (endIndex === -1) continue

    const demoContent = section.substring(0, endIndex)
    const remainingContent = section.substring(endIndex + 3)

    // 提取标题和描述
    const lines = demoContent.trim().split('\n')
    let title = ''
    let description = ''
    let codeStart = false
    const codeLines: string[] = []

    for (const line of lines) {
      if (!codeStart) {
        if (line.trim().startsWith('```')) {
          codeStart = true
          continue
        }
        if (!title) {
          title = line.trim()
        } else if (!description) {
          description = line.trim()
        }
      } else {
        if (line.trim().startsWith('```')) {
          break
        }
        codeLines.push(line)
      }
    }

    if (codeLines.length > 0) {
      examples.push({
        title: title || `示例 ${i}`,
        description: description || '',
        code: codeLines.join('\n').trim(),
      })
    }
  }

  return examples
}

/**
 * 获取组件的使用示例
 * @param server
 */
export function registerGetComponentExamples(server: McpServer) {
  server.registerTool(
    'get_component_examples',
    {
      title: 'Get Component Examples',
      description: '获取 Element-UI 组件的具体使用示例代码。从组件文档中提取所有代码示例。',
      inputSchema: z.object({
        tagName: z.string().describe('组件标签名, 例如：el-button'),
        exampleIndex: z.number().optional().describe('获取特定示例的索引（从0开始），不指定则返回所有示例'),
      }),
      outputSchema: z.object({
        tagName: z.string().describe('组件标签名'),
        examples: z.array(
          z.object({
            title: z.string().describe('示例标题'),
            description: z.string().describe('示例描述'),
            code: z.string().describe('示例代码'),
          })
        ),
        total: z.number().describe('示例总数'),
      }),
    },
    async ({ tagName, exampleIndex }) => {
      const component = componentObject.components[tagName]

      if (!component) {
        throw new Error(`Component "${tagName}" not found. Available components: ${Object.keys(componentObject.components).join(', ')}`)
      }

      // 读取文档内容
      let examples: Array<{ title: string; description: string; code: string }> = []
      try {
        const mdPath = path.join(__dirname, '../data/docs', `${tagName}.md`)
        if (fs.existsSync(mdPath)) {
          const markdownContent = fs.readFileSync(mdPath, 'utf8')
          examples = parseExamples(markdownContent)
        }
      } catch (error) {
        console.warn(`Failed to read examples for ${tagName}:`, error)
      }

      // 如果指定了示例索引，返回特定示例
      let resultExamples = examples
      if (exampleIndex !== undefined) {
        if (exampleIndex >= 0 && exampleIndex < examples.length) {
          resultExamples = [examples[exampleIndex]]
        } else {
          throw new Error(`Example index ${exampleIndex} is out of range. Total examples: ${examples.length}`)
        }
      }

      const result = {
        tagName,
        examples: resultExamples,
        total: examples.length,
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
