import { tryAddJavaExecutable, tryAddJavaHome, type JavaRuntime } from './helper/adder'
import { scanJavaRuntimes, tryReturnCacheIfValid } from './helper/scan'
import { loadUserJavaPathsFromStore, saveUserJavaPathsToStore, setScanCache } from './helper/stores'

export { tryUserSelectJava, removeUserJavaPathFromStore } from './helper/user'
export { type JavaRuntime } from './helper/adder'
export { store } from './helper/stores'

export async function scanJava(force = false) {
  const fromCache = tryReturnCacheIfValid(force)
  if (fromCache) {
    return fromCache
  }

  // 没有有效 cache：执行完整扫描（自动 + 用户持久化项）
  const auto = await scanJavaRuntimes() // 自动扫描（你已有实现）
  // 解析用户持久化的（若自动扫描已包含则跳过）
  const entries = loadUserJavaPathsFromStore()
  const manualRTs: JavaRuntime[] = []

  for (const e of entries) {
    const existsAuto = auto.find(a => a.javaExe === e.path || a.javaHome === e.path)
    if (existsAuto) continue
    let rt: JavaRuntime | null = null
    if (e.path.toLowerCase().endsWith(process.platform === 'win32' ? 'java.exe' : 'java')) {
      rt = await tryAddJavaExecutable(e.path, 'user-added', undefined, true)
    }
    if (!rt) rt = await tryAddJavaHome(e.path, 'user-added', true)
    if (rt) {
      manualRTs.push(rt)
      // update metadata
      e.lastValidatedAt = new Date().toISOString()
      e.lastValid = true
    } else {
      // 标记为无效（方便 UI 提示）
      e.lastValidatedAt = new Date().toISOString()
      e.lastValid = false
    }
  }
  // save possible validation changes
  saveUserJavaPathsToStore(entries)

  // 合并并写入 cache
  const map = new Map<string, JavaRuntime>()
  for (const r of [...auto, ...manualRTs]) {
    if (!map.has(r.javaExe)) map.set(r.javaExe, r)
  }
  const final = Array.from(map.values())
  setScanCache({ ts: Date.now(), platform: process.platform, results: final })
  return final
}