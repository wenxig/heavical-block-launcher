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

import { app } from 'electron'
import { WindowManager } from 'window-manager'

import { createInitAppDefault } from './helper/app'
const initApp = createInitAppDefault()

const createMainWindow = () => WindowManager.create('main')

app.whenReady().then(async () => {
  initApp([
    [
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
    ]
  ])
  createMainWindow()
})