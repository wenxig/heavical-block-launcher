import { homedir } from 'node:os'
import path from 'node:path'

const PLATFORM = process.platform // 'win32'|'darwin'|'linux'
export const isWindows = PLATFORM === 'win32'
export const isMac = PLATFORM === 'darwin'
export const isLinux = PLATFORM === 'linux'

export const javaExecutableName = isWindows ? 'java.exe' : 'java'
export const javacExecutableName = isWindows ? 'javac.exe' : 'javac'

// Platform-specific common paths
export function commonJavaDirs(): string[] {
  const dirs: string[] = []
  if (isWindows) {
    const programFiles = process.env['PROGRAMFILES'] || 'C:\\Program Files'
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)'
    dirs.push(path.join(programFiles, 'Java'))
    dirs.push(path.join(programFilesX86, 'Java'))
    // common vendor folders
    dirs.push(path.join(programFiles, 'BellSoft'))
    dirs.push(path.join(programFiles, 'AdoptOpenJDK'))
    dirs.push(path.join(programFiles, 'Amazon Corretto'))
    dirs.push(path.join(programFiles, 'Microsoft'))
  } else if (isMac) {
    dirs.push('/Library/Java/JavaVirtualMachines')
    dirs.push(path.join(homedir(), 'Library', 'Java', 'JavaVirtualMachines'))
    // homebrew
    dirs.push('/opt/homebrew/Cellar/openjdk')
    dirs.push('/usr/local/Cellar/openjdk')
  } else if (isLinux) {
    dirs.push('/usr/lib/jvm')
    dirs.push('/usr/java')
    dirs.push('/usr/lib64/jvm')
    dirs.push(path.join(homedir(), '.sdkman', 'candidates', 'java'))
  }
  return dirs
}