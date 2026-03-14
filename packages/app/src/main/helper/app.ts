import url from 'url'

import { electronApp, optimizer, platform, type Platform } from '@electron-toolkit/utils'
import {
  type WebContents,
  Tray,
  Menu,
  type Privileges,
  protocol,
  app,
  net,
} from 'electron/main'
import { RefValue, SharedValue } from 'ipc-call/main'
declare module 'ipc-call/main' {
  interface SharedValueType {
    platform: Platform
  }
}

import macTrayIcon from '../../../resources/iconTemplate@2x.png?asset'
import icon from '../../../resources/iconWhite.png?asset'
import type { SharedValues } from '../../preload/ipc'
import { injectToJSON } from '../helper/toJSON'
import { useAppStore } from '../store/app'
import { useAtomStore } from '../store/atom'

export const alertMessage = <T extends string>(
  win: WebContents,
  event: T,
  ...args: any[]
) => win.send(event.toString(), ...args)

export class TrayMenu {
  public menu: RefValue<(Electron.MenuItemConstructorOptions | Electron.MenuItem)[]>
  public tray: Tray
  constructor(menu: Array<Electron.MenuItemConstructorOptions | Electron.MenuItem>) {
    this.menu = new RefValue(menu)
    this.tray = new Tray(platform.isMacOS ? macTrayIcon : icon)
    this.reload()
    this.tray.setToolTip('Heavical Block Launcher')
    this.tray.addListener('click', () => {
      this.tray.popUpContextMenu()
    })
    this.menu.watch(() => this.reload())
  }
  public reload() {
    const contextMenu = Menu.buildFromTemplate(this.menu.value)
    this.tray.setContextMenu(contextMenu)
  }
}

const useProtocolProxy = (
  v: [
    schema: string,
    handler: (path: string, request: GlobalRequest) => GlobalResponse | Promise<GlobalResponse>,
    config?: Privileges
  ][]
) => {
  protocol.registerSchemesAsPrivileged(
    v.map(v => ({
      scheme: v[0],
      privileges: {
        supportFetchAPI: true,
        stream: true,
        allowServiceWorkers: true,
        corsEnabled: false,
        standard: true,
        secure: true,
        bypassCSP: true,
        codeCache: false,
        ...v[2]
      }
    }))
  )
  return () => {
    for (const row of v) {
      protocol.handle(row[0], request => row[1](request.url.slice(`${row[0]}://`.length), request))
    }
  }
}

type TrayMenuConfig = Array<Electron.MenuItemConstructorOptions | Electron.MenuItem>
export const createInitAppDefault = (
  config: { proxy?: Parameters<typeof useProtocolProxy>[0]; appId?: string } = {}
) => {
  injectToJSON()

  console.log('[versions reporting]')
  for (const name in process.versions)
    if (Object.prototype.hasOwnProperty.call(process.versions, name))
      console.log(name, ':', process.versions[name])
  console.log('[versions report end]')

  const apply = useProtocolProxy([
    ...(config.proxy ?? []),
    [
      'atom',
      (_path, req) => {
        const atomStore = useAtomStore()
        const p = atomStore.get(req.url)
        console.debug('[atom request]', req.url, p)
        if (!p) throw new Error(`id not found (id=${req.url})`)
        console.debug('[atom request]', req.url, p)
        return net.fetch(url.pathToFileURL(p).toString())
      }
    ]
  ])
  app.on('window-all-closed', () => {
    if (!platform.isMacOS) app.quit()
  })
  app.on('before-quit', () => {
    process.exit(0)
  })
  const appStore = useAppStore()
  process.chdir(appStore.root)

  Menu.setApplicationMenu(null)
  return (trayMenu: TrayMenuConfig[] = []) => {
    apply()
    new SharedValue<SharedValues, 'platform'>(
      'platform',
      platform.isLinux ? 'linux' : platform.isMacOS ? 'macos' : 'windows'
    )
    electronApp.setAppUserModelId(config.appId ?? 'com.wenxig.template')
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })
    app.dock?.hide()
    return trayMenu.map(tmConfig => new TrayMenu(tmConfig))
  }
}