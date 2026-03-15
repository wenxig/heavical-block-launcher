import { platform } from '@electron-toolkit/utils'
import { app } from 'electron/main'
import { InjectFunction, SharedValue } from 'ipc-call/main'
import { WindowManager } from 'window-manager'

import type { InjectFunctions, SharedValues } from '../../preload/ipc'

export const initOs = () => {
  InjectFunction.from<InjectFunctions>()('os.exit', () => {
    app.exit(0)
  })
  InjectFunction.from<InjectFunctions>()('os.miniSize', () => {
    WindowManager.each(v => v.minimize())
  })
  SharedValue.from<SharedValues>()(
    'os.platform',
    platform.isLinux ? 'linux' : platform.isMacOS ? 'macos' : 'windows'
  )
}