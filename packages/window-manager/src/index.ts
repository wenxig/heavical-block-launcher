import path from 'node:path'

import { is } from '@electron-toolkit/utils'
import type { AnyFn } from '@vueuse/core'
import { BrowserWindow, ipcRenderer, shell, type BrowserWindowConstructorOptions } from 'electron'
import { isFunction, merge } from 'es-toolkit'

export interface GlobalEvents extends Record<string, any[]> {}
export interface Inject {
  event<T extends keyof GlobalEvents>(
    event: T,
    callback: (...p: GlobalEvents[T]) => void
  ): () => void
}
declare global {
  interface Window {
    inject: Inject
  }
}

export namespace WindowManager {
  export const init = () =>
    ({
      event: (e, cb) => {
        const handle = (_: any, ...args: Parameters<typeof cb>) => cb(...args)
        ipcRenderer.on(e.toString(), handle)
        return () => ipcRenderer.off(e.toString(), handle)
      }
    }) as Inject

  export const windows = new Map<string, BrowserWindow>()
  export const add = (key: string, win: BrowserWindow) => {
    windows.set(key, win)
    win.once('closed', () => {
      try {
        windows.delete(key)
      } catch {}
    })
    win.once('close', () => {
      try {
        windows.delete(key)
      } catch {}
    })
  }
  export const doSync = <K extends keyof BrowserWindow>(
    key: K,
    ...args: BrowserWindow[K] extends AnyFn ? Parameters<BrowserWindow[K]> : never
  ) => {
    const fn = (win: BrowserWindow) => {
      const method = win[key]
      if (isFunction(method)) (method as any).apply(win, args)
    }
    for (const win of windows.values()) fn(win)
  }
  export const each = (f: (v: BrowserWindow) => void) => {
    for (const win of windows.values()) {
      f(win)
    }
  }
  export const alertMessage = <T extends keyof GlobalEvents>(
    event: T,
    ...args: GlobalEvents[T]
  ) => {
    each(win => win.webContents.send(event.toString(), ...args))
  }
  let defaultConfig: BrowserWindowConstructorOptions = {
    title: '',
    center: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      spellcheck: false
    },
    autoHideMenuBar: true,
    show: false
  }
  export const setDefault = (config: BrowserWindowConstructorOptions) =>
    (defaultConfig = merge(defaultConfig, config))
  export const create = (
    name: string,
    config: Partial<BrowserWindowConstructorOptions> = {},
    _path = '/'
  ) => {
    config = merge(config, defaultConfig)
    const win = new BrowserWindow(config)
    win.webContents.session.webRequest.onBeforeSendHeaders((details, callback) =>
      callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } })
    )
    win.webContents.session.webRequest.onHeadersReceived((details, callback) =>
      callback({
        responseHeaders: { 'Access-Control-Allow-Origin': ['*'], ...details.responseHeaders }
      })
    )
    console.log(name, 'window created', config)
    win.on('ready-to-show', () => {
      console.log(name, 'window show')

      win.show()
    })
    win.webContents.setWindowOpenHandler(details => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}${_path}`)
    } else {
      win.loadFile(`${path.join(__dirname, '../renderer/index.html')}${_path}`)
    }
    add(name, win)
    return win
  }
}