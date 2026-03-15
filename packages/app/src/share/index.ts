import type { JavaRuntime } from 'java-finder'

export type Platform = 'macos' | 'windows' | 'linux'
export interface SharedValues {
  'os.platform': Platform

  'java.result': JavaRuntime[]
}

export type InjectFunctions = {
  'os.exit': () => void
  'os.miniSize': () => void

  'java.scan': (force?: boolean) => Promise<JavaRuntime[]>
  'java.addUserSelect': () => Promise<boolean>
  'java.removeJava': (path: string) => Promise<void>
}