#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// 复制示例文档目录
const srcExamplesDir = path.join(projectRoot, 'src', 'examples')
const distExamplesDir = path.join(projectRoot, 'dist', 'examples')

console.log('📁 Copying examples...')

// 复制示例文档目录
if (fs.existsSync(srcExamplesDir)) {
  fs.mkdirSync(distExamplesDir, { recursive: true })

  function copyDir(src: string, dest: string) {
    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true })
        copyDir(srcPath, destPath)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }

  copyDir(srcExamplesDir, distExamplesDir)
  console.log('✅ Examples directory copied')
}
console.log('✅ Data directory copied successfully!')
