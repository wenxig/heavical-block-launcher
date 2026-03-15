import { contextBridge, ipcRenderer } from 'electron'
import { init as wmInit, type Inject } from 'window-manager/preload'

export const init = () => {
  const inject: Inject = {
    ...wmInit(),
    sharedValue: {
      boot(name) {
        return ipcRenderer.sendSync(`_sync_value_${name}_boot_`)
      },
      sync(name, v) {
        return ipcRenderer.invoke(`_sync_value_${name}_`, v)
      },
      watch(name, cb) {
        const c = `_sync_value_${name}_watch_`
        const handle = (_e: any, v: Parameters<typeof cb>[0]) => cb(v)
        ipcRenderer.on(c, handle)
        return () => ipcRenderer.off(c, handle)
      }
    },
    injectFunction: {
      call(name, ...p) {
        return ipcRenderer.invoke(`_call_function_${name}_`, p)
      },
      sync(name, ...p) {
        return ipcRenderer.sendSync(`_call_function_sync_${name}_`, p)
      }
    }
  }

  if (process.contextIsolated) {
    try {
      contextBridge.exposeInMainWorld('inject', inject)
    } catch (error) {
      console.error(error)
    }
  } else {
    window.inject = inject
  }
}