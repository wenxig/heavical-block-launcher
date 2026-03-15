import type { InjectFunctions, SharedValues } from '@s/index'
import { InjectFunction, SharedValue } from 'ipc-call/main'
import * as Java from 'java-finder'

export const initJava = () => {
  InjectFunction.from<InjectFunctions>()('java.scan', async (force = false) => {
    return await Java.scanJava(force).then(v => {
      result.set(() => v)
      return v
    })
  })
  InjectFunction.from<InjectFunctions>()('java.addUserSelect', async () => {
    const { ok, runtime, reason } = await Java.tryUserSelectJava()
    if (!ok) throw new Error(reason)
    if (runtime) result.set(v => v.concat([runtime]))
    return ok
  })
  InjectFunction.from<InjectFunctions>()('java.removeJava', async (path: string) => {
    return Java.removeUserJavaPathFromStore(path)
  })
  const result = SharedValue.from<SharedValues>()('java.result', [])
  Java.store.onDidChange('scanCache', cache => {
    result.set(v => cache?.results ?? v)
  })
  Java.store.onDidChange('userJava', () => {
    result.set(v => Java.store.get('scanCache')?.results ?? v)
  })
}