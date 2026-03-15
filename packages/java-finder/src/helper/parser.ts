import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

import { isExists } from './fs'
import { isWindows } from './platform'
const execFileAsync = promisify(execFile)

export async function readReleaseFile(javaHome: string) {
  const releasePath = path.join(javaHome, 'release')
  if (!(await isExists(releasePath))) return null
  try {
    const content = await fs.readFile(releasePath, 'utf8')
    return parseReleaseContent(content)
  } catch {
    return null
  }
}

export function parseReleaseContent(content: string): Record<string, string> {
  // release 文件通常每行类似 KEY="value"
  const lines = content.split(/\r?\n/)
  const map: Record<string, string> = {}
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=\"(.*)\"$/)
    if (m) map[m[1]] = m[2]
  }
  return map
}

export async function getJavaInfoFromExecutable(exePath: string, timeoutMs = 4000) {
  // 尝试执行 `java -XshowSettings:properties -version`（大多数实现把属性输出到 stderr）
  // 再 fallback 到 `java -version`
  try {
    const args = ['-XshowSettings:properties', '-version']
    const { stdout, stderr } = await execFileAsync(exePath, args, { timeout: timeoutMs })
    const out = (stdout || '') + (stderr || '')
    return parseJavaExecOutput(out)
  } catch {
    // 部分 JVM 不支持 -XshowSettings，退回到 -version
    try {
      const { stdout, stderr } = await execFileAsync(exePath, ['-version'], { timeout: timeoutMs })
      const out = (stdout || '') + (stderr || '')
      return parseJavaExecOutput(out)
    } catch {
      return null
    }
  }
}

function parseJavaExecOutput(output: string) {
  // output 里通常含有 lines like:
  // java version "1.8.0_391"
  // openjdk version "17.0.1" 2021-10-19
  // OpenJDK Runtime Environment (build 11.0.11+9)
  // Vendor strings may appear in "Runtime Environment" line or "OpenJDK" etc.
  const lines = output
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
  let version: string | undefined
  let vendor: string | undefined
  for (const line of lines) {
    // version line
    const m1 = line.match(/(?:java|openjdk|jdk)\s+version\s+"([^"]+)"/i)
    if (m1 && !version) version = m1[1]
    const m2 = line.match(/^(?:openjdk|java)\s+version\s+([^ ]+)/i)
    if (m2 && !version) version = m2[1].replace(/"/g, '')
    // vendor heuristics
    if (/openjdk/i.test(line) && !vendor) vendor = 'OpenJDK'
    if (/oracle/i.test(line) && !vendor) vendor = 'Oracle'
    if (/bellsoft/i.test(line) && !vendor) vendor = 'BellSoft'
    if (/adopt(openjdk)?/i.test(line) && !vendor) vendor = 'AdoptOpenJDK'
    if (/microsoft/i.test(line) && !vendor) vendor = 'Microsoft'
    if (/zulu/i.test(line) && !vendor) vendor = 'Zulu'
  }

  // try to find java.home or java.home = /path from -XshowSettings
  let javaHome: string | undefined
  const mHome = output.match(/(?:java.home|java\.home)\s*=\s*(.*)/i)
  if (mHome) {
    javaHome = mHome[1].trim()
    // sometimes quoted
    if (javaHome.startsWith('"') && javaHome.endsWith('"')) javaHome = javaHome.slice(1, -1)
  }

  return { version, vendor, javaHome } as { version?: string; vendor?: string; javaHome?: string }
}

// Windows registry query (simple): parse JavaHome from typical keys
export async function queryWindowsRegistryJavaHomes(): Promise<string[]> {
  if (!isWindows) return []
  const keys = [
    'HKLM\\SOFTWARE\\JavaSoft\\Java Runtime Environment',
    'HKLM\\SOFTWARE\\JavaSoft\\Java Development Kit',
    'HKLM\\SOFTWARE\\Wow6432Node\\JavaSoft\\Java Runtime Environment',
    'HKLM\\SOFTWARE\\Wow6432Node\\JavaSoft\\Java Development Kit'
  ]
  const homes: Set<string> = new Set()
  for (const key of keys) {
    try {
      // use reg query
      const { stdout } = await execFileAsync('reg', ['query', key, '/s'], { timeout: 4000 })
      // parse lines like "    JavaHome    REG_SZ    C:\Program Files\Java\jre1.8.0_361"
      const lines = stdout.split(/\r?\n/)
      for (const line of lines) {
        const m = line.match(/JavaHome\s+REG_SZ\s+(.+)$/i)
        if (m) homes.add(m[1].trim())
      }
      // some keys contain "JavaHome" under version subkeys
    } catch {
      // ignore query errors
    }
  }
  return Array.from(homes)
}

export function guessArchFromPath(p: string): string {
  const s = p.toLowerCase()
  if (s.includes('arm64') || s.includes('aarch64')) return 'arm64'
  if (s.includes('64')) return 'x64'
  if (s.includes('86')) return 'x86'
  return 'unknown'
}