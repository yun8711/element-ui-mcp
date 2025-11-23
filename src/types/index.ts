// 基础类型：类型字符串与更丰富的结构化类型
export interface TypeInfo {
  raw: string // 'string' | 'number | string' | "'circle' | 'square'" 等
  kind?:
    | 'string'
    | 'number'
    | 'boolean'
    | 'enum'
    | 'union'
    | 'object'
    | 'function'
    | 'unknown'
  enumValues?: string[] // ['circle', 'square']
  ts?: string // 来自 d.ts 的原始类型定义（可选）
}

// Props
export interface ComponentProp {
  name: string
  description?: string // 来自 web-types 或文档
  type: TypeInfo // 来自 d.ts + web-types
  required?: boolean // 来自 d.ts
  default?: string | number | boolean | null // web-types 或文档表格
}

// Events
export interface ComponentEvent {
  name: string
  description?: string
  parameters?: TypeInfo[] // e.g. [{ raw: 'event: Event' }]
  ts?: string // d.ts 中完整事件签名
}

// Slots
export interface ComponentSlot {
  name: string
  description?: string
  props?: Record<string, TypeInfo> // slot-scope 参数
}


// 最终组件统一模型
export interface ComponentModel {
  tagName: string // el-avatar (实际使用的组件名)
  description?: string // 中文说明（来自 md）
  docUrl?: string // 中文文档URL

  props: ComponentProp[]
  events: ComponentEvent[]
  slots: ComponentSlot[]
}
