import path from 'node:path'

import { dialog } from 'electron'
import z from 'zod'

import { tryAddJavaExecutable, tryAddJavaHome, type JavaRuntime } from './adder'
import { isExists } from './fs'
import {
  getScanCache,
  loadUserJavaPathsFromStore,
  saveUserJavaPathsToStore,
  setScanCache
} from './stores'

export const storedUserJava = z.object({
  path: z.string(), // 用户选择的原始路径（可能是 exe 或 java home）
  label: z.string().optional(), // 可选，UI 上展示用（例如 "用户选择：C:\Program Files\Java\jdk-17"）
  addedAt: z.string(),
  lastValidatedAt: z.string().optional(), // 最近一次校验时间（ISO）
  lastValid: z.boolean().optional() // 上次校验结果
})
export type StoredUserJava = z.infer<typeof storedUserJava>

async function addUserJavaPathToStore(p: string, label?: string): Promise<JavaRuntime | null> {
  // p 可能是 exe 或 java home - 先尝试解析
  let rt: JavaRuntime | null = null
  if (p.toLowerCase().endsWith(process.platform === 'win32' ? 'java.exe' : 'java')) {
    rt = await tryAddJavaExecutable(p, 'user-added', undefined, true)
  }
  if (!rt) {
    rt = await tryAddJavaHome(p, 'user-added', true)
  }
  if (!rt) {
    // 尝试常见构造（用户选择 dir）
    const candidate = path.join(p, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
    if (await isExists(candidate))
      rt = await tryAddJavaExecutable(candidate, 'user-added', undefined, true)
  }

  if (!rt) return null

  // 写入 store（去重）
  const list = loadUserJavaPathsFromStore()
  const normalized = path.resolve(p)
  if (!list.find(e => path.resolve(e.path) === normalized)) {
    list.push({
      path: normalized,
      label,
      addedAt: new Date().toISOString(),
      lastValidatedAt: new Date().toISOString(),
      lastValid: true
    })
    saveUserJavaPathsToStore(list)
  } else {
    // 更新校验时间/状态
    const ex = list.find(e => path.resolve(e.path) === normalized)!
    ex.lastValidatedAt = new Date().toISOString()
    ex.lastValid = true
    saveUserJavaPathsToStore(list)
  }

  // 更新/合并缓存：如果有 cache，直接把新 runtime 合并进去以便 UI 立即可见（避免短时间重复扫描）
  const cache = getScanCache()
  if (cache && cache.platform === process.platform) {
    const exists = (cache.results ?? []).some(r => r.javaExe === rt!.javaExe)
    if (!exists) {
      const merged = [...(cache.results ?? []), rt]
      setScanCache({ ts: Date.now(), platform: process.platform, results: merged })
    } else {
      // optional: refresh ts
      setScanCache({ ...cache, ts: Date.now() })
    }
  } else {
    // 若没有 cache，则写入一个新的 cache 包含刚添加的 rt（避免 UI 空白）
    setScanCache({ ts: Date.now(), platform: process.platform, results: [rt] })
  }

  return rt
}

export async function tryUserSelectJava() {
  const res = await dialog.showOpenDialog({
    title: 'Select Java executable or Java home',
    properties: ['openFile', 'openDirectory'],
    filters:
      process.platform === 'win32' ? [{ name: 'Executables', extensions: ['exe'] }] : undefined
  })
  if (res.canceled || res.filePaths.length === 0) return { ok: false, reason: 'canceled' }
  const chosen = res.filePaths[0]
  const rt = await addUserJavaPathToStore(chosen)
  if (!rt) return { ok: false, reason: 'invalid-java' }
  return { ok: true, runtime: rt }
}

export async function removeUserJavaPathFromStore(p: string) {
  const list = loadUserJavaPathsFromStore()
  const normalized = path.resolve(p)
  const filtered = list.filter(e => path.resolve(e.path) !== normalized)
  saveUserJavaPathsToStore(filtered)
  // 失效缓存（更安全）
  setScanCache(null)
}