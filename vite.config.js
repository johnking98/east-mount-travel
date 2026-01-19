import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',  // ← 确保这行存在
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 确保public文件夹的内容被复制
    copyPublicDir: true
  }
})
