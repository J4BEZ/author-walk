import react from '@vitejs/plugin-react'
import { defineConfig, transformWithOxc } from 'vite'

// src의 .js 컴포넌트에서도 JSX를 사용할 수 있도록 변환합니다.
const jsxInJavaScript = {
  name: 'jsx-in-javascript',
  enforce: 'pre',
  transform(code, id) {
    const [filename] = id.split('?')
    if (!filename.includes('/src/') || !filename.endsWith('.js')) return

    return transformWithOxc(code, filename, {
      lang: 'jsx',
      jsx: { runtime: 'automatic' },
      sourcemap: true,
    })
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [jsxInJavaScript, react()],
  optimizeDeps: {
    rolldownOptions: {
      moduleTypes: { '.js': 'jsx' },
    },
  },
})
