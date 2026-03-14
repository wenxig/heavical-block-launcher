import fs from 'fs/promises'

export namespace FsHelper {
  export const isExists = async (path: string) => {
    try {
      await fs.access(path, fs.constants.W_OK | fs.constants.R_OK)
    } catch {
      return false
    }
    return true
  }
  export const readJsonFile = async <T extends object>(
    path: string,
    encoding: BufferEncoding = 'utf-8'
  ): Promise<T> => JSON.parse((await fs.readFile(path)).toString(encoding))
}