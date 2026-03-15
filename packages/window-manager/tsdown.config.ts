import { defineConfig } from 'tsdown'

export default defineConfig([
  { entry: ['./src/preload.ts'], dts: true, outDir: 'dist' },
  { entry: ['./src/index.ts'], dts: true, outDir: 'dist' }
])