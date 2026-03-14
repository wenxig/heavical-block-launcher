import type { AnyFn } from '@vueuse/core'
import { ipcMain, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron'
import { isFunction } from 'es-toolkit'
import { isObject } from 'es-toolkit/compat'
import mitt from 'mitt'
import { WindowManager } from 'window-manager'

import type { InjectFunctionResult } from '../type'

export class RefValue<T> {
  constructor(protected _value: T) {}
  public get value() {
    return this._value
  }
  public set value(v) {
    if (!isObject(v) && !isFunction(v)) if (this._value == v) return
    console.debug('[RefValue] setter value')
    this._value = v
    this.update()
  }
  public update() {
    this.mitt.emit('watch', this._value)
  }
  public async set(f: (v: T) => T | Promise<T>) {
    console.debug('[RefValue] set() value')
    this.value = await f(this._value)
    this.update()
  }
  protected mitt = mitt<{ watch: T }>()
  public watch(fn: (v: T) => void) {
    this.mitt.on('watch', fn)
    return () => this.mitt.off('watch', fn)
  }
}

const sharedValueLocal = mitt<{ changed: [name: string | number, value: SharedValue<any, any>] }>()
export class SharedValue<
  TGlobal extends Record<string, any>,
  T extends keyof TGlobal,
  VT extends TGlobal[T] = TGlobal[T]
> extends RefValue<VT> {
  public destroy: () => void
  private get name() {
    return this.name_.toString()
  }
  constructor(
    public readonly name_: T,
    _value: TGlobal[T]
  ) {
    super(<VT>_value)
    const handleValueChange = (_e: any, value: VT) => {
      if (!isObject(value) && !isFunction(value)) if (this._value == value) return
      console.debug('[SharedValue]', name, 'handleValueChange')
      this._value = value
      this.mitt.emit('watch', this._value)
    }
    const channel = `_sync_value_${this.name}_`
    ipcMain.handle(channel, handleValueChange)

    const handleValueBoot = (e: IpcMainEvent) => (e.returnValue = this._value)
    const bootChannel = `${channel}boot_`
    ipcMain.addListener(bootChannel, handleValueBoot)

    const handleLocalSync = ([name, value]: [
      name: string | number,
      value: SharedValue<any, any>
    ]) => {
      if (name != this.name || value == this) return
      console.debug('[SharedValue]', name, 'handleLocalSync')
      this._value = value.value
      this.mitt.emit('watch', value.value)
    }
    sharedValueLocal.on('changed', handleLocalSync)

    this.destroy = () => {
      ipcMain.removeHandler(channel)
      ipcMain.removeListener(bootChannel, handleValueBoot)
      this.mitt.all.clear()
      sharedValueLocal.off('changed', handleLocalSync)
    }
  }
  public override update() {
    console.debug('[SharedValue]', this.name, 'update')
    super.update()
    sharedValueLocal.emit('changed', [this.name, this])
    WindowManager.each(win => {
      win.webContents.send(`_sync_value_${this.name}_watch_`, this._value)
    })
  }
}
export class InjectFunction<
  TGlobal extends Record<string, AnyFn>,
  T extends keyof TGlobal,
  FT extends AnyFn = TGlobal[T]
> {
  public destroy: () => void
  private get name() {
    return this.name_.toString()
  }
  constructor(
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
  public static from<
    TGlobal extends Record<string, any>,
    T extends keyof TGlobal,
    FT extends TGlobal[T] = TGlobal[T]
  >(name: T, fun: FT, _this?: any) {
    new InjectFunction(name.toString(), fun, _this)
    return fun
  }
  public static inject<TGlobal extends Record<string, any>, K extends keyof TGlobal>(
    name: K,
    _this: any
  ) {
    return function <T extends string>(c: Record<T, TGlobal[K]>, key: T) {
      console.debug('[InjectFunction]this:', Object.keys(c), c[key])
      InjectFunction.from(name.toString(), c[key].bind(_this) as TGlobal[K], _this)
    }
  }
}