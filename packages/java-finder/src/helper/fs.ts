import { promises as fs } from 'node:fs'
import path from 'node:path'

import { javaExecutableName } from './platform'

export async function isExists(p: string) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

export async function findExecutablesInDirectory(root: string, depth = 3): Promise<string[]> {
  const results: string[] = []
  async function walk(dir: string, d: number) {
    if (d < 0) return
    let entries: string[] = []
    try {
      entries = await fs.readdir(dir)
    } catch {
      return
    }
    for (const name of entries) {
      const full = path.join(dir, name)
      try {
        const st = await fs.stat(full)
        if (st.isDirectory()) {
          // if directory name looks like a jdk or jre, go deeper
          await walk(full, d - 1)
        } else if (st.isFile()) {
          if (name.toLowerCase() === javaExecutableName.toLowerCase()) {
            results.push(full)
          }
        }
      } catch {
        // ignore
      }
    }
  }
  await walk(root, depth)
  return results
}