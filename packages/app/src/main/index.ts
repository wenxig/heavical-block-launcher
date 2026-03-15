declare global {
  interface Error {
    toJSON: () => string
    [x: symbol]: any
  }
  interface Set<T> {
    toJSON: () => Array<T>
  }
  interface Map<K, V> {
    toJSON: () => Record<string | number, V>
  }
}

import { installExtension, VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { crashReporter } from 'electron/common'
import { app } from 'electron/main'
import { WindowManager } from 'window-manager'

import { createInitAppDefault } from './helper/app'
import { initJava } from './helper/java'
import { initOs } from './helper/os'

crashReporter.start({ uploadToServer: false })
const initApp = createInitAppDefault()

const createMainWindow = () =>
  WindowManager.create('main', { transparent: true, frame: false, width: 1000, height: 500 })

app.whenReady().then(async () => {
  initApp([
    {
      label: 'DevTool',
      type: 'normal',
      click: () => {
        WindowManager.each(v => v.webContents.openDevTools())
      }
    },
    {
      label: '退出',
      type: 'normal',
      click: () => {
        app.quit()
      }
    }
  ])
  initOs()
  initJava()
  installExtension(VUEJS_DEVTOOLS, { loadExtensionOptions: { allowFileAccess: true } })
    .then(ext => console.log(`Added Extension:  ${ext.name}`))
    .catch(err => console.log('An error occurred: ', err))
  createMainWindow()
})