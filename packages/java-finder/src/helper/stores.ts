import { z } from 'zod'
import Store from 'zod-electron-store'

import { javaRuntime } from './adder'
import { storedUserJava, type StoredUserJava } from './user'

const scanCache = z.object({
  ts: z.number(), // Date.now()
  platform: z.string(), // process.platform
  results: z.array(javaRuntime) // 序列化后的 JavaRuntime 列表
})
type ScanCache = z.infer<typeof scanCache>

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 缓存默认 5 分钟

const schema = z.object({
  userJava: z.array(storedUserJava).default([]),
  scanCache: scanCache.nullable().default(null),
  cacheTTL: z.number().default(DEFAULT_TTL_MS)
})

export const store = new Store<z.infer<typeof schema>>({
  schema,
  defaults: { cacheTTL: DEFAULT_TTL_MS, scanCache: null, userJava: [] },
  name: 'java-finder',
  watch: true
})

export function getCacheTTL() {
  return store.get('cacheTTL') ?? DEFAULT_TTL_MS
}

export function loadUserJavaPathsFromStore(): StoredUserJava[] {
  return store.get('userJava') ?? []
}

export function saveUserJavaPathsToStore(list: StoredUserJava[]) {
  store.set('userJava', list)
}

export function getScanCache(): ScanCache | null | undefined {
  return store.get('scanCache')
}

export function setScanCache(cache: ScanCache | null) {
  store.set('scanCache', cache)
}