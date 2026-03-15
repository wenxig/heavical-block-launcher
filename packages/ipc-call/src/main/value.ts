import { ipcMain, type IpcMainEvent } from 'electron/main'
import { isFunction } from 'es-toolkit'
import { isObject } from 'es-toolkit/compat'
import mitt from 'mitt'
import { WindowManager } from 'window-manager'

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
  public get name() {
    return this.name_.toString()
  }
  private constructor(
    private readonly name_: T,
    _value: TGlobal[T]
  ) {
    super(<VT>_value)
    const handleValueChange = (_e: any, value: VT) => {
      if (!isObject(value) && !isFunction(value)) if (this._value == value) return
      console.debug('[SharedValue]', this.name, 'handleValueChange')
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
  public static from<TGlobal extends Record<string, any>>() {
    return <T extends keyof TGlobal>(name: T, value: TGlobal[T]) => {
      return new this<TGlobal, T>(name, value)
    }
  }
}