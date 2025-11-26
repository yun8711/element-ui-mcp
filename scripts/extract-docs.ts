import { dirname, resolve, join } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import {
  ComponentModel,
  ComponentProp,
  ComponentEvent,
  ComponentSlot,
  ComponentMethod,
} from '../src/types/index.ts'
import { marked } from 'marked'
import * as cheerio from 'cheerio'

// =============================================
// 配置路径：你的 Element UI 源码路径
// =============================================
// 本项目绝对路径
const projectPath = resolve(dirname(fileURLToPath(import.meta.url)), '../')
// 本地element-ui源码路径
const ELEMENT_SRC = resolve(projectPath, '../../opensource/element')
// element-ui组件目录
const COMPONENTS_DIR = join(ELEMENT_SRC, 'packages')
// element-ui中文文档目录
const DOCS_DIR_ZH = join(ELEMENT_SRC, 'examples/docs/zh-CN')
// element-ui web-types.json路径
const WEB_TYPES_PATH = join(ELEMENT_SRC, 'web-types.json')
// 输出组件数据文件路径
const OUTPUT = resolve(projectPath, 'src/metadata/components.ts')
// 输出文档文件路径
const DOCS_OUTPUT_DIR = resolve(projectPath, 'src/examples')

// =========================================================
// 读取 web-types.json
// =========================================================
function loadWebTypes() {
  if (!fs.existsSync(WEB_TYPES_PATH)) {
    console.warn('⚠️ web-types.json not found:', WEB_TYPES_PATH)
    return null
  }
  return JSON.parse(fs.readFileSync(WEB_TYPES_PATH, 'utf-8'))
}

// =========================================================
// 读取所有中文 markdown 文档
// =========================================================
function readMarkdownDocs() {
  const files = fs.readdirSync(DOCS_DIR_ZH).filter(f => f.endsWith('.md'))
  const docs: Record<string, string> = {}

  files.forEach(file => {
    const content = fs.readFileSync(join(DOCS_DIR_ZH, file), 'utf-8')
    const name = file.replace('.md', '')
    docs[name] = content
  })

  return docs
}

// =========================================================
// 从 markdown 提取描述、demo 区块、methods（使用 marked + cheerio）
// =========================================================

function parseMarkdown(md: string, componentName?: string) {
  // 1. Markdown 转 HTML（同步模式）
  const html = marked.parse(md, { async: false }) as string
  const $ = cheerio.load(html)


  let description = ''
  const examples: any[] = []
  const methodsMap: Record<string, ComponentMethod[]> = {}
  const eventsMap: Record<string, ComponentEvent[]> = {}

  // 2. 提取描述（从第一个段落获取）
  const firstParagraph = $('p').first().text().trim()
  if (firstParagraph) {
    description = firstParagraph
  }

  // 3. 提取示例代码（从 :::demo 块）
  $('pre code').each((index, element) => {
    const code = $(element).text().trim()
    if (code) {
      examples.push({
        title: `示例 ${index + 1}`,
        code: code,
      })
    }
  })

  // 4. 提取方法信息
  let currentComponentType = componentName ? componentName.replace('el-', '') : 'default'

  $('h3').each((index, heading) => {
    const headingText = $(heading).text().trim()

        // 检测 Methods 或 Events 标题（支持多种格式）
        const isMethodsSection = headingText.includes('方法') || headingText.includes('Methods')
        const isEventsSection = headingText.includes('Events') || headingText.includes('事件')

        if (isMethodsSection || isEventsSection) {
          const isMethods = isMethodsSection

          // 确定组件类型（从标题中提取，或使用当前组件类型）
          if (headingText.includes('Table') || headingText.includes('表格')) {
            currentComponentType = 'table'
          } else if (headingText.includes('Input') || headingText.includes('输入框')) {
            currentComponentType = 'input'
          } else if (headingText.includes('Form') || headingText.includes('表单')) {
            currentComponentType = 'form'
          } else if (headingText.includes('Menu') || headingText.includes('菜单')) {
            currentComponentType = 'menu'
          } else if (headingText.includes('Statistic') || headingText.includes('统计')) {
            currentComponentType = 'statistic'
          } else if (headingText.includes('Carousel') || headingText.includes('轮播')) {
            currentComponentType = 'carousel'
          } else if (headingText.includes('Cascader') && headingText.includes('Panel')) {
            currentComponentType = 'cascader-panel'
          } else if (headingText.includes('Cascader')) {
            currentComponentType = 'cascader'
          } else if (headingText.includes('Tree') || headingText.includes('树')) {
            currentComponentType = 'tree'
          }
          // 对于通用标题如 "### 方法" 或 "### Events"，保持当前的 currentComponentType

          // 查找后面的表格（可能不直接相邻）
          let tableElement = $(heading).next('table')
          if (tableElement.length === 0) {
            // 如果直接下一个不是表格，查找后面的兄弟元素
            let sibling = $(heading).next()
            while (sibling.length > 0 && !sibling.is('table')) {
              sibling = sibling.next()
            }
            if (sibling.is('table')) {
              tableElement = sibling
            }
          }

          if (tableElement.length > 0) {
            if (isMethods) {
              const methods = parseMethodsTableFromHTML(tableElement, $)
              if (!methodsMap[currentComponentType]) {
                methodsMap[currentComponentType] = []
              }
              methodsMap[currentComponentType].push(...methods)
            } else {
              const events = parseEventsTableFromHTML(tableElement, $)
              if (!eventsMap[currentComponentType]) {
                eventsMap[currentComponentType] = []
              }
              eventsMap[currentComponentType].push(...events)
            }
          }
        }
  })

  return { description, examples, methodsMap, eventsMap }
}

// 从 HTML 表格中解析方法信息
function parseMethodsTableFromHTML(tableElement: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): ComponentMethod[] {
  const methods: ComponentMethod[] = []

  // 检查表头是否是方法表格（支持多种格式）
  const headers = tableElement.find('thead th').map((i, th) => $(th).text().trim()).get()
  const isMethodsTable = headers.length >= 3 &&
    (headers[0] === '方法名' || headers[0] === 'Method') &&
    (headers[1] === '说明' || headers[1] === 'Description') &&
    (headers[2] === '参数' || headers[2] === 'Parameters')

  if (isMethodsTable) {
    // 解析表格行
    tableElement.find('tbody tr').each((rowIndex, row) => {
      const cells = $(row).find('td').map((i, td) => $(td).text().trim()).get()

      if (cells.length >= 3) {
        const methodName = cells[0]
        const methodDescription = cells[1]
        const methodParameters = cells[2]

        // 跳过空行或无效行
        if (methodName && methodName !== '方法名' && methodName !== 'Method' && methodName !== '----' && methodName !== '---') {
          const method: ComponentMethod = {
            name: methodName,
            description: methodDescription || '',
            parameters: methodParameters && methodParameters !== '—' && methodParameters !== '-' && methodParameters !== 'N/A' ?
              [{ raw: methodParameters }] : [],
          }
          methods.push(method)
        }
      }
    })
  }

  return methods
}

// 从 HTML 表格中解析事件信息
function parseEventsTableFromHTML(tableElement: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): ComponentEvent[] {
  const events: ComponentEvent[] = []

  // 检查表头是否是事件表格（支持多种格式）
  const headers = tableElement.find('thead th').map((i, th) => $(th).text().trim()).get()
  const isEventsTable = headers.length >= 3 &&
    (headers[0] === '事件名' || headers[0] === '事件名称' || headers[0] === 'Event') &&
    (headers[1] === '说明' || headers[1] === 'Description') &&
    (headers[2] === '参数' || headers[2] === '回调参数' || headers[2] === 'Parameters')

  if (isEventsTable) {
    // 解析表格行
    tableElement.find('tbody tr').each((rowIndex, row) => {
      const cells = $(row).find('td').map((i, td) => $(td).text().trim()).get()

      if (cells.length >= 3) {
        const eventName = cells[0]
        const eventDescription = cells[1]
        const eventParameters = cells[2]

        // 跳过空行或无效行
        if (eventName && eventName !== '事件名' && eventName !== '事件名称' && eventName !== 'Event' && eventName !== '----' && eventName !== '---') {
          const event: ComponentEvent = {
            name: eventName,
            description: eventDescription || '',
            parameters: eventParameters && eventParameters !== '—' && eventParameters !== '-' && eventParameters !== 'N/A' ?
              [{ raw: eventParameters }] : [],
          }
          events.push(event)
        }
      }
    })
  }

  return events
}

// 过滤 markdown 内容，移除 API 表格部分，只保留代码示例
function filterMarkdownContent(md: string): string {
  const lines = md.split('\n')
  const filteredLines: string[] = []
  let inApiSection = false
  let inCodeBlock = false
  let skipNextTable = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // 检测代码块开始/结束
    if (trimmedLine.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      filteredLines.push(line)
      continue
    }

    // 在代码块内，保留所有内容
    if (inCodeBlock) {
      filteredLines.push(line)
      continue
    }

    // 检测 API 相关标题
    if (trimmedLine.match(/^###\s+(Attributes|Props|属性|Events|事件|Methods|方法|Slots|插槽|Slot)/i) ||
        trimmedLine.match(/^###\s+(Table|Input|Form|Menu|Statistic|Carousel|Cascader|Tree|Upload)?\s*(Attributes|Props|属性|Events|事件|Methods|方法|Slots|插槽|Slot)/i)) {
      inApiSection = true
      skipNextTable = true
      // 不添加这个标题行
      continue
    }

    // 如果在 API 部分
    if (inApiSection) {
      // 检测表格开始
      if (trimmedLine.includes('|') && skipNextTable) {
        // 跳过表格相关行，直到下一个标题或代码块
        continue
      }

      // 检测下一个主要标题（跳出 API 部分）
      if (trimmedLine.match(/^###\s/) && !trimmedLine.match(/^###\s+(Attributes|Props|属性|Events|事件|Methods|方法|Slots|插槽|Slot)/i)) {
        inApiSection = false
        skipNextTable = false
      }

      // 检测 :::demo 块（示例代码），即使在 API 部分也要保留
      if (trimmedLine.includes(':::demo')) {
        inApiSection = false // 临时跳出 API 部分以保留示例
        filteredLines.push(line)
        continue
      }

      // 检测空行或分隔行，可能是表格结束
      if (trimmedLine === '' || trimmedLine.match(/^[-+=*_]{3,}$/)) {
        skipNextTable = false
        continue
      }

      // 跳过 API 部分的普通文本
      continue
    }

    // 检测 :::demo 块开始
    if (trimmedLine.includes(':::demo')) {
      filteredLines.push(line)
      continue
    }

    // 保留其他内容（描述、示例等）
    filteredLines.push(line)
  }

  return filteredLines.join('\n')
}

// =========================================================
// 解析 d.ts 文件：仅提取 props, events
// =========================================================
function parseDTS(dtsPath: string) {
  if (!fs.existsSync(dtsPath)) {
    return { props: [], events: [], slots: [] }
  }

  const text = fs.readFileSync(dtsPath, 'utf-8')

  const props: ComponentProp[] = []
  const events: ComponentEvent[] = []

  // 改进的属性解析：只匹配简单类型，不包含复杂对象或函数
  const propRegex = /^\s+(\w+)\??:\s*([^;{}=>\n]+)/gm
  let m
  while ((m = propRegex.exec(text))) {
    const propName = m[1]
    let typeStr = m[2].trim()

    // 跳过构造函数、方法等
    if (typeStr.includes('(') || typeStr.includes('new ')) {
      continue
    }

    // 清理类型字符串，移除注释和多余空格
    typeStr = typeStr.replace(/\s*\*.*$/gm, '').trim()

    props.push({
      name: propName,
      type: { raw: typeStr },
      required: !text.includes(`${propName}?:`),
    })
  }

  // 事件解析保持不变
  const eventRegex = /on(\w+)\??:\s*\(([^)]+)\)/g
  while ((m = eventRegex.exec(text))) {
    const eventName = m[1].toLowerCase()
    events.push({
      name: eventName,
      parameters: [{ raw: m[2] }],
      ts: m[0],
    })
  }

  return { props, events, slots: [] }
}

// =========================================================
// 合并 props（优先级：web-types > d.ts）
// =========================================================
function mergeProps(
  webProps: any[],
  dtsProps: ComponentProp[]
): ComponentProp[] {
  const merged: ComponentProp[] = []

  for (const wp of webProps) {
    const dts = dtsProps.find(p => p.name === wp.name)

    merged.push({
      name: wp.name,
      description: wp.description ?? dts?.description,
      required: wp.required ?? dts?.required,
      default: wp.default,
      type: {
        raw: dts?.type.raw ?? wp.type,
      },
    })
  }

  return merged
}

// =========================================================
// 合并 events（优先级：markdown > web-types > d.ts）
// =========================================================
function mergeEvents(
  webEvents: any[],
  dtsEvents: ComponentEvent[],
  mdEvents: ComponentEvent[] = []
): ComponentEvent[] {
  const merged: ComponentEvent[] = []

  // 首先添加 markdown 中的事件
  for (const mdEvent of mdEvents) {
    merged.push(mdEvent)
  }

  // 然后添加 web-types 的事件（如果没有重复）
  for (const we of webEvents) {
    const existing = merged.find(e => e.name === we.name)
    if (!existing) {
      const dts = dtsEvents.find(e => e.name === we.name)
      merged.push({
        name: we.name,
        description: we.description,
        parameters: dts?.parameters ?? [{ raw: we.type }],
        ts: dts?.ts,
      })
    }
  }

  // 最后添加 d.ts 中的事件（如果没有重复）
  for (const dtsEvent of dtsEvents) {
    const existing = merged.find(e => e.name === dtsEvent.name)
    if (!existing) {
      merged.push(dtsEvent)
    }
  }

  return merged
}

// =========================================================
// 主流程
// =========================================================
function generate() {
  console.log('📚 Loading web-types...')
  const webTypes = loadWebTypes()

  console.log('📄 Loading markdown...')
  const markdowns = readMarkdownDocs()

  console.log('📦 Reading component dirs...')
  const componentNames = fs
    .readdirSync(COMPONENTS_DIR)
    .filter(name => fs.statSync(join(COMPONENTS_DIR, name)).isDirectory())

  const components: Record<string, ComponentModel> = {}

  for (const comp of componentNames) {
    const compDir = join(COMPONENTS_DIR, comp)

    // --- d.ts ---
    const dtsPath = join(ELEMENT_SRC, 'types', `${comp}.d.ts`)

    // --- web-types ---
    const wtEntry = webTypes.contributions.html['vue-components'].find(
      (el: any) =>
        el.name.toLowerCase() === `el-${comp}` ||
        el.name === `El${comp.charAt(0).toUpperCase() + comp.slice(1)}`
    )

    // --- 组件名称 ---
    const componentName = `el-${comp}`

    // --- markdown ---
    const md = markdowns[comp] ?? ''
    const mdParsed = parseMarkdown(md, componentName)

    const dts = parseDTS(dtsPath)

    const props = wtEntry
      ? mergeProps(wtEntry.props ?? [], dts.props)
      : dts.props

    // 从 markdown 中解析的事件
    const mdEvents = mdParsed.eventsMap[comp] || mdParsed.eventsMap['default'] || []

    const events = wtEntry
      ? mergeEvents(wtEntry.js?.events ?? wtEntry.events ?? [], dts.events, mdEvents)
      : mergeEvents([], dts.events, mdEvents)

    const slots: ComponentSlot[] =
      wtEntry?.slots?.map((s: any) => ({
        name: s.name,
        description: s.description,
      })) ?? []
    const docFileName = `${componentName}.md`
    const docFilePath = join(DOCS_OUTPUT_DIR, docFileName)
    fs.mkdirSync(DOCS_OUTPUT_DIR, { recursive: true })

    // 过滤 markdown 内容，移除 API 表格，只保留代码示例
    const filteredMd = filterMarkdownContent(md)
    fs.writeFileSync(docFilePath, filteredMd, 'utf-8')

    // --- 复制 d.ts 文件 ---
    if (fs.existsSync(dtsPath)) {
      const dtsFileName = `${componentName}.d.ts`
      const dtsOutputPath = join(DOCS_OUTPUT_DIR, dtsFileName)
      fs.copyFileSync(dtsPath, dtsOutputPath)
    }

    // --- 构建 ComponentModel ---
    components[componentName] = {
      tagName: componentName,
      description: wtEntry?.description ?? mdParsed.description,
      // https://element.eleme.cn/#/zh-CN/component/border
      docUrl: `https://element.eleme.cn/#/zh-CN/component/${componentName.replace(
        'el-',
        ''
      )}`,
      props,
      events,
      slots,
      methods: mdParsed.methodsMap[comp] || mdParsed.methodsMap['default'] || [], // 从 markdown 文档中解析的方法信息
    }

  }

  fs.mkdirSync(dirname(OUTPUT), { recursive: true })

  // 输出为 ES 模块，直接导出 components 对象
  const jsContent = `// Auto-generated by extract-docs.ts
// Do not edit this file manually

export default ${JSON.stringify(components, null, 2)}
`

  fs.writeFileSync(OUTPUT, jsContent, 'utf-8')

  console.log('🎉 Done! Output generated:', OUTPUT)
}

generate()
