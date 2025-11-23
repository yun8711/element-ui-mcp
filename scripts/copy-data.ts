#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const srcDataDir = path.join(projectRoot, 'src', 'data')
const distDataDir = path.join(projectRoot, 'dist', 'data')

console.log('📁 Copying data directory...')

// 确保目标目录存在
fs.mkdirSync(distDataDir, { recursive: true })

// 复制整个data目录
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

copyDir(srcDataDir, distDataDir)
console.log('✅ Data directory copied successfully!')
