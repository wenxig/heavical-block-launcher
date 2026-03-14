import { defineConfig } from 'tsdown'

export default defineConfig([
  { entry: './src/main/index.ts', dts: { build: true }, outDir: 'dist/main' },
  { entry: './src/preload/index.ts', dts: { build: true }, outDir: 'dist/preload' },
  { entry: './src/renderer/index.ts', dts: { build: true }, outDir: 'dist/renderer' }
])