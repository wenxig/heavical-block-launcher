import { realpath } from 'node:fs/promises'
import path from 'node:path'

import z from 'zod'

import { isExists } from './fs'
import { getJavaInfoFromExecutable, guessArchFromPath, readReleaseFile } from './parser'
import { javacExecutableName, javaExecutableName } from './platform'

export const javaRuntime = z.object({
  javaExe: z.string(), // 可执行文件绝对路径
  javaHome: z.string().optional(), // JAVA_HOME（如果能推出）
  version: z.string().optional(), // 解析到的版本字符串（例如 1.8.0_361 或 17.0.8）
  vendor: z.string().optional(), // 实现厂商，如 AdoptOpenJDK / BellSoft / Oracle / Microsoft
  arch: z.string().optional(), // x64 / x86 / arm64 / unknown（启发式）
  isJDK: z.boolean().optional(), // 是否包含 javac 的推断
  source: z.string().optional(),
  isUserAddition: z.boolean()
})

export type JavaRuntime = z.infer<typeof javaRuntime>

export async function tryAddJavaHome(
  javaHome: string,
  source: string,
  isUserAddition = false
): Promise<JavaRuntime | null> {
  try {
    // normalize
    javaHome = path.resolve(javaHome)
    const exe = path.join(javaHome, 'bin', javaExecutableName)
    if (!(await isExists(exe))) {
      // macOS jre bundles sometimes: jre/Contents/Home
      const altExe = path.join(javaHome, 'Contents', 'Home', 'bin', javaExecutableName)
      if (await isExists(altExe)) {
        return tryAddJavaExecutable(altExe, source)
      }
      return null
    }
    return tryAddJavaExecutable(exe, source, javaHome, isUserAddition)
  } catch {
    return null
  }
}

export async function tryAddJavaExecutable(
  exe: string,
  source: string,
  knownJavaHome?: string,
  isUserAddition = false
): Promise<JavaRuntime | null> {
  try {
    exe = path.resolve(exe)
    if (!(await isExists(exe))) return null
    // resolve symlink
    let realExe = exe
    try {
      realExe = await realpath(exe)
    } catch {}
    const infoFromExec = await getJavaInfoFromExecutable(realExe)
    // try release file if knownJavaHome or from java.home
    let javaHome = knownJavaHome
    if (!javaHome && infoFromExec?.javaHome) javaHome = infoFromExec.javaHome
    if (!javaHome) {
      // fallback to parent of bin
      const p = path.dirname(path.dirname(realExe))
      javaHome = p
    }

    // try read release file (prefer)
    const release = await readReleaseFile(javaHome).catch(() => null)
    let version = infoFromExec?.version
    let vendor = infoFromExec?.vendor
    if (release && !version) {
      // release file may have JAVA_VERSION / IMPLEMENTOR / IMPLEMENTOR_VERSION
      if (release['JAVA_VERSION']) version = release['JAVA_VERSION']
      if (release['IMPLEMENTOR']) vendor = release['IMPLEMENTOR']
      if (release['IMPLEMENTOR_VERSION'] && !vendor) vendor = release['IMPLEMENTOR_VERSION']
    }

    // is JDK if contains javac
    const javacPath = path.join(javaHome, 'bin', javacExecutableName)
    const isJDK = await isExists(javacPath)

    const arch = guessArchFromPath(javaHome) || guessArchFromPath(realExe)

    const rt: JavaRuntime = {
      javaExe: realExe,
      javaHome,
      version,
      vendor,
      arch,
      isJDK,
      source,
      isUserAddition
    }
    return rt
  } catch {
    return null
  }
}