import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    './src/index.ts',
    './src/stdio.ts',
    './src/tools/**/*.ts',
  ],
  external:['./src/types/', './src/data/'],
  format: ['esm'],
  clean: true,
  splitting: true, // 启用代码分割
  treeshake: true, // 启用 tree shaking
  target: 'es2022',
  minify: false,
  platform: 'node',
  // 保留目录结构的关键配置
  bundle: false, // 不打包成单个文件，保持模块化
  esbuildOptions(options) {
    options.charset = 'utf8' // 添加这行来保留中文字符
  }
})