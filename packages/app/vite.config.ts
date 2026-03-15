import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import type { RendererViteConfig } from 'electron-vite'
import MotionResolver from 'motion-v/resolver'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { ConfigEnv, type AliasOptions } from 'vite'
import VueRouter from 'vue-router/vite'

export default ({ command }: ConfigEnv, alias: AliasOptions): RendererViteConfig => ({
  plugins: [
    VueRouter({ dts: 'typed-router.d.ts', routesFolder: 'src/renderer/src/pages' }),
    vue(),
    vueJsx(),
    Components({ dts: true, resolvers: [NaiveUiResolver(), MotionResolver()] }),
    tailwindcss()
  ],
  css: { transformer: 'lightningcss' },
  build: { cssMinify: 'lightningcss', minify: 'oxc', license: true, sourcemap: command == 'build' },
  resolve: { alias }
})