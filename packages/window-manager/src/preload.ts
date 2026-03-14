
import { ipcRenderer } from 'electron/main'

export const init = () =>
  ({
    event: (e, cb) => {
      const handle = (_: any, ...args: Parameters<typeof cb>) => cb(...args)
      ipcRenderer.on(e.toString(), handle)
      return () => ipcRenderer.off(e.toString(), handle)
    }
  }) as Inject

export interface Inject {
  event<TGlobal extends Record<string, any[]>, T extends keyof TGlobal>(
    event: T,
    callback: (...p: TGlobal[T]) => void
  ): () => void
}
declare global {
  interface Window {
    inject: Inject
  }
}