import { defineConfig } from 'tsdown'

export default defineConfig({ entry: './src/main/index.ts', dts: { build: true } })