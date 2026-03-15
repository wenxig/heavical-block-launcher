import { realpath } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

import { tryAddJavaExecutable, type JavaRuntime } from './adder'
import { findExecutablesInDirectory, isExists } from './fs'
import { queryWindowsRegistryJavaHomes } from './parser'
import { commonJavaDirs, isLinux, isMac, isWindows, javaExecutableName } from './platform'
import { getCacheTTL, getScanCache } from './stores'

export async function scanPathEnv(): Promise<string[]> {
  const pathEnv = process.env.PATH || process.env.Path || ''
  if (!pathEnv) return []
  const parts = pathEnv.split(path.delimiter).filter(Boolean)
  const found: Set<string> = new Set()
  for (const p of parts) {
    const exe = path.join(p, javaExecutableName)
    if (await isExists(exe)) {
      try {
        const r = await realpath(exe)
        found.add(r)
      } catch {
        found.add(exe)
      }
    }
  }
  return Array.from(found)
}

async function scanMinecraftRuntimes(): Promise<string[]> {
  // 尝试常见的 Minecraft / launcher 自带 runtime 目录（启发式）
  const candidates: string[] = []
  if (isWindows) {
    const appData = process.env.APPDATA
    if (appData) {
      candidates.push(path.join(appData, '.minecraft', 'runtime'))
      candidates.push(path.join(appData, 'minecraft', 'runtime'))
    }
  } else if (isMac) {
    candidates.push(path.join(homedir(), 'Library', 'Application Support', 'minecraft', 'runtime'))
    candidates.push(path.join(homedir(), 'Library', 'Application Support', 'minecraft'))
  } else {
    candidates.push(path.join(homedir(), '.minecraft', 'runtime'))
    candidates.push(path.join(homedir(), '.minecraft'))
  }
  const results: string[] = []
  for (const c of candidates) {
    if (await isExists(c)) {
      // find bin/java under sub-dirs
      const execs = await findExecutablesInDirectory(c, 4)
      results.push(...execs)
    }
  }
  return results
}

async function scanUserConfigured(): Promise<string[]> {
  // 支持环境变量 HMCL_JRES 或 USER_JAVA (示例)，以及 ~/.jdks
  const found: string[] = []
  const envs = ['HMCL_JRES', 'USER_JAVA', 'JAVA_HOME']
  for (const e of envs) {
    const v = process.env[e]
    if (v) {
      // could be single path or PATH-like
      if (v.includes(path.delimiter)) {
        for (const p of v.split(path.delimiter).filter(Boolean)) {
          // if points to bin/java or to home
          const exe = p.toLowerCase().endsWith(javaExecutableName.toLowerCase())
            ? p
            : path.join(p, 'bin', javaExecutableName)
          if (await isExists(exe)) found.push(exe)
        }
      } else {
        const exe = v.toLowerCase().endsWith(javaExecutableName.toLowerCase())
          ? v
          : path.join(v, 'bin', javaExecutableName)
        if (await isExists(exe)) found.push(exe)
      }
    }
  }
  // ~/.jdks dir
  const jdkDir = path.join(homedir(), '.jdks')
  if (await isExists(jdkDir)) {
    const execs = await findExecutablesInDirectory(jdkDir, 3)
    found.push(...execs)
  }
  return found
}

/**
 * 主函数：扫描并返回 JavaRuntime 列表
 */
export async function scanJavaRuntimes(): Promise<JavaRuntime[]> {
  const candidates: Set<string> = new Set()
  const results: JavaRuntime[] = []

  // 1) user configured / env
  const userConfigured = await scanUserConfigured()
  userConfigured.forEach(p => candidates.add(p))

  // 2) PATH
  const pathExecs = await scanPathEnv()
  pathExecs.forEach(p => candidates.add(p))

  // 3) platform common dirs
  const commonDirs = commonJavaDirs()
  for (const d of commonDirs) {
    if (await isExists(d)) {
      const execs = await findExecutablesInDirectory(d, 4)
      execs.forEach(e => candidates.add(e))
    }
  }

  // 4) Minecraft / Launcher runtimes
  const mcExecs = await scanMinecraftRuntimes()
  mcExecs.forEach(e => candidates.add(e))

  // 5) Windows registry
  if (isWindows) {
    const homes = await queryWindowsRegistryJavaHomes()
    for (const h of homes) {
      const exe = path.join(h, 'bin', javaExecutableName)
      candidates.add(exe)
    }
  }

  // 6) also probe likely java homes like /usr/lib/jvm/*/bin/java etc (additional)
  if (isLinux) {
    const dir = '/usr/lib/jvm'
    if (await isExists(dir)) {
      const execs = await findExecutablesInDirectory(dir, 3)
      execs.forEach(e => candidates.add(e))
    }
  }

  // Try to add all candidates, with source info
  for (const candidate of Array.from(candidates)) {
    // classify source lightly
    let source = 'candidate'
    if (candidate.includes('.minecraft') || candidate.toLowerCase().includes('runtime'))
      source = 'minecraft-runtime'
    else if (candidate.includes('Program Files') || candidate.toLowerCase().includes('java'))
      source = 'program-files'
    else if (candidate.includes(homedir())) source = 'home'
    else if (candidate.includes(path.delimiter === ';' ? '\\' : '/')) source = 'path'

    const rt = await tryAddJavaExecutable(candidate, source)
    if (rt) results.push(rt)
  }

  // dedupe by real javaExe path
  const map = new Map<string, JavaRuntime>()
  for (const r of results) {
    const key = r.javaExe
    if (!map.has(key)) map.set(key, r)
    else {
      // merge missing fields
      const ex = map.get(key)!
      if (!ex.version && r.version) ex.version = r.version
      if (!ex.vendor && r.vendor) ex.vendor = r.vendor
      if (!ex.javaHome && r.javaHome) ex.javaHome = r.javaHome
      if (!ex.arch && r.arch) ex.arch = r.arch
      if (!ex.isJDK && r.isJDK) ex.isJDK = r.isJDK
    }
  }

  // produce array sorted by (isJDK desc, version desc-ish, arch)
  const final = Array.from(map.values()).sort((a, b) => {
    if ((a.isJDK ? 1 : 0) !== (b.isJDK ? 1 : 0)) return (b.isJDK ? 1 : 0) - (a.isJDK ? 1 : 0)
    const va = a.version || ''
    const vb = b.version || ''
    if (va !== vb) return vb.localeCompare(va, undefined, { numeric: true, sensitivity: 'base' })
    return (a.arch || '').localeCompare(b.arch || '')
  })

  return final
}

export function tryReturnCacheIfValid(forceRefresh = false): JavaRuntime[] | null {
  if (forceRefresh) return null
  const cache = getScanCache()
  if (!cache) return null
  if (cache.platform !== process.platform) return null
  const ttl = getCacheTTL()
  if (Date.now() - cache.ts > ttl) return null
  return cache.results ?? null
}