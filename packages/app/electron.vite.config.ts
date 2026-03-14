import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'electron-vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import VueRouter from 'vue-router/vite'

export default defineConfig({
  main: { resolve: { alias: { '@m': fileURLToPath(new URL('src/main', import.meta.url)) } } },
  preload: {
    resolve: { alias: { '@p': fileURLToPath(new URL('src/preload', import.meta.url)) } }
  },
  renderer: {
    plugins: [
      VueRouter({ dts: 'typed-router.d.ts' }),
      vue(),
      vueJsx(),
      Components({ dts: true, resolvers: [NaiveUiResolver()] }),
      tailwindcss()
    ],
    css: { transformer: 'lightningcss', lightningcss: {} },
    resolve: { alias: { '@': fileURLToPath(new URL('src/renderer/src', import.meta.url)) } }
  }
})