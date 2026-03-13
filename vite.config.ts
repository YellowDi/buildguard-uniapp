import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { fileURLToPath, URL } from 'node:url'

const uniPlugin = (uni as unknown as { default?: () => unknown[]; (): unknown[] }).default ?? uni

export default defineConfig({
  plugins: uniPlugin(),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
