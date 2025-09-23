import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true
    },
    define: {
        __API_BASE_URL__: JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:3000/api')
    }
})