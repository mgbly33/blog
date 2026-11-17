import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: '现代博客 · Modern Blog',
        short_name: '现代博客',
        description: '一个现代化的博客与深度写作社区',
        theme_color: '#F4F1EA',
        background_color: '#F4F1EA',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // 仅缓存公开只读 API 请求，严禁缓存带鉴权的个人私有接口
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/(?:blogs(?!\/liked|\/bookmarks)|categories|tags|series).*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1天
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10,
            },
          },
          // 图片资源：Stale While Revalidate
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30天
              },
            },
          },
          // 字体：Cache First
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
              },
            },
          },
          // CSS/JS 静态资源：Stale While Revalidate
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7天
              },
            },
          },
        ],
        // 预缓存导航路由（SPA shell）
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/feed/, /^\/uploads/, /^\/swagger/],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/feed': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
