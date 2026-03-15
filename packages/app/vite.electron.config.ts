import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'electron-vite'
import type { AliasOptions } from 'vite'

import frontend from './vite.config'

const alias = (main: string): AliasOptions => {
  const alias: AliasOptions = {
    '@m': fileURLToPath(new URL('src/main', import.meta.url)),
    '@s': fileURLToPath(new URL('src/share', import.meta.url)),
    '@p': fileURLToPath(new URL('src/preload', import.meta.url)),
    '@r': fileURLToPath(new URL('src/renderer/src', import.meta.url))
  }
  switch (main) {
    case 'main':
      alias['@'] = alias['@m']
      delete alias['@m']
      break
    case 'preload':
      alias['@'] = alias['@p']
      delete alias['@p']
      break
    case 'renderer':
      alias['@'] = alias['@r']
      delete alias['@r']
      break
  }
  return alias
}

export default defineConfig(cfg => ({
  main: { resolve: { alias: alias('main') }, build: { bytecode: true } },
  preload: { resolve: { alias: alias('preload') }, build: { bytecode: true } },
  renderer: frontend(cfg, alias('renderer'))
}))