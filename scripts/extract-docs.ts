import { dirname, resolve, join } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import {
  ComponentModel,
  ComponentProp,
  ComponentEvent,
  ComponentSlot,
} from '../src/types/index.ts'

// =============================================
// 配置路径：你的 Element UI 源码路径
// =============================================
// 本项目绝对路径
const projectPath = resolve(dirname(fileURLToPath(import.meta.url)), '../')
const ELEMENT_SRC = resolve(projectPath, '../../opensource/element')
const COMPONENTS_DIR = join(ELEMENT_SRC, 'packages')
const DOCS_DIR_ZH = join(ELEMENT_SRC, 'examples/docs/zh-CN')
const WEB_TYPES_PATH = join(ELEMENT_SRC, 'web-types.json')
// 输出
const OUTPUT = resolve(projectPath, 'src/data/components.js')
const DOCS_OUTPUT_DIR = resolve(projectPath, 'src/data/docs')

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
// 从 markdown 提取描述、demo 区块
// =========================================================
function parseMarkdown(md: string) {
  const lines = md.split('\n')

  let description = ''
  const examples: any[] = []

  let inDemo = false
  let demoCode: string[] = []
  let demoTitle = ''

  for (const line of lines) {
    if (line.startsWith('# ')) continue

    if (!description && line.trim().length > 0) {
      description = line.trim()
    }

    if (line.includes(':::demo')) {
      inDemo = true
      demoTitle = line.replace(':::demo', '').trim()
      demoCode = []
      continue
    }

    if (line.includes(':::') && inDemo) {
      inDemo = false
      examples.push({
        title: demoTitle,
        code: demoCode.join('\n'),
      })
      continue
    }

    if (inDemo) {
      demoCode.push(line)
    }
  }

  return { description, examples }
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
// 合并 events（优先级：web-types > d.ts）
// =========================================================
function mergeEvents(
  webEvents: any[],
  dtsEvents: ComponentEvent[]
): ComponentEvent[] {
  const merged: ComponentEvent[] = []

  for (const we of webEvents) {
    const dts = dtsEvents.find(e => e.name === we.name)

    merged.push({
      name: we.name,
      description: we.description,
      parameters: dts?.parameters ?? [{ raw: we.type }],
      ts: dts?.ts,
    })
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

    // --- markdown ---
    const md = markdowns[comp] ?? ''
    const mdParsed = parseMarkdown(md)

    // --- d.ts ---
    const dtsPath = join(ELEMENT_SRC, 'types', `${comp}.d.ts`)

    // --- web-types ---
    const wtEntry = webTypes.contributions.html['vue-components'].find(
      (el: any) =>
        el.name.toLowerCase() === `el-${comp}` ||
        el.name === `El${comp.charAt(0).toUpperCase() + comp.slice(1)}`
    )

    const dts = parseDTS(dtsPath)

    const props = wtEntry
      ? mergeProps(wtEntry.props ?? [], dts.props)
      : dts.props

    const events = wtEntry
      ? mergeEvents(wtEntry.js?.events ?? wtEntry.events ?? [], dts.events)
      : dts.events

    const slots: ComponentSlot[] =
      wtEntry?.slots?.map((s: any) => ({
        name: s.name,
        description: s.description,
      })) ?? []

    // --- 写入文档文件 ---
    const componentName = `el-${comp}`
    const docFileName = `${componentName}.md`
    const docFilePath = join(DOCS_OUTPUT_DIR, docFileName)
    fs.mkdirSync(DOCS_OUTPUT_DIR, { recursive: true })
    fs.writeFileSync(docFilePath, md, 'utf-8')

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
