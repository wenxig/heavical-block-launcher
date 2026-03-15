import type { AnyFn } from '@vueuse/core'
import { ipcMain, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron/main'

import type { InjectFunctionResult } from '../type'

export class InjectFunction<
  TGlobal extends Record<string, AnyFn>,
  T extends keyof TGlobal,
  FT extends AnyFn = TGlobal[T]
> {
  public destroy: () => void
  private get name() {
    return this.name_.toString()
  }
  private constructor(
    public readonly name_: T,
    protected fun: FT,
    _this: any = {}
  ) {
    const channel = `_call_function_${this.name}_`
    const handleCallFunction = async (
      _e: IpcMainInvokeEvent,
      p: Parameters<FT>
    ): Promise<InjectFunctionResult<ReturnType<FT>>> => {
      console.debug('[InjectFunction] call inject function', this.name)
      try {
        return { isError: false, result: await fun.call(_this, ...p) }
      } catch (error) {
        console.error(error)
        return { isError: true, result: error }
      }
    }
    ipcMain.handle(channel, handleCallFunction)

    const channelSync = `_call_function_sync_${this.name}_`
    const handleCallFunctionSync = async (
      e: IpcMainEvent,
      p: Parameters<FT>
    ): Promise<InjectFunctionResult<ReturnType<FT>>> => {
      console.debug('[InjectFunction] call inject function', this.name)
      try {
        return (e.returnValue = { isError: false, result: await fun.call(_this, ...p) })
      } catch (error) {
        console.error(error)
        return (e.returnValue = { isError: true, result: error } as const)
      }
    }
    ipcMain.addListener(channelSync, handleCallFunctionSync)

    this.destroy = () => {
      ipcMain.removeHandler(channel)
      ipcMain.removeListener(channelSync, handleCallFunctionSync)
    }
  }
  public static from<TGlobal extends Record<string, any>>() {
    return <T extends keyof TGlobal, FT extends TGlobal[T] = TGlobal[T]>(
      name: T,
      fn: FT,
      that?: any
    ) => {
      const ins = new this<TGlobal, T, FT>(name, fn, that)
      return Object.assign(fn, ins)
    }
  }
}