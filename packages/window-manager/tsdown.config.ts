import { defineConfig } from 'tsdown'

export default defineConfig([
  { entry: ['./src/preload.ts'], dts: true, format: ['cjs', 'esm'], outDir: 'dist' },
  { entry: ['./src/index.ts'], dts: true, format: ['cjs', 'esm'], outDir: 'dist' }
])