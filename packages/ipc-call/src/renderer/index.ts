import type { AnyFn } from '@vueuse/core'
import mitt from 'mitt'
import { onUnmounted, ref, watch, type Ref } from 'vue'
import type {} from 'window-manager'

const sharedValueLocal = mitt<{ changed: [name: string, value: Ref] }>()
export const useShareValue = <
  TGlobal extends Record<string, any>,
  T extends keyof TGlobal,
  VT = TGlobal[T]
>(
  name_: T
) => {
  const name = name_.toString()
  const refValue = ref(window.inject.sharedValue.boot<VT>(name))
  const stopSync = window.inject.sharedValue.watch<VT>(name, value => {
    console.log('[useShareValue] been sync', name, value, '->', value)
    refValue.value = value
  })
  const handleLocalSync = ([name, value]: [name: keyof TGlobal, value: Ref]) => {
    if (name != name || value == refValue) return
    console.log('[useShareValue] handleLocalSync', name, value, '->', value.value)
    refValue.value = value.value
  }
  sharedValueLocal.on('changed', handleLocalSync)
  const watcher = watch(
    refValue,
    refValue => {
      window.inject.sharedValue.sync(name, refValue)
      sharedValueLocal.emit('changed', [name, refValue])
    },
    { deep: true }
  )
  onUnmounted(() => {
    console.log('[useShareValue] destroy', name)
    watcher.stop()
    stopSync()
    sharedValueLocal.off('changed', handleLocalSync)
  })
  return refValue as Ref<VT, VT>
}

export class InjectFunction<
  TGlobal extends Record<string, AnyFn>,
  T extends keyof TGlobal,
  FT extends (...args: any) => any = TGlobal[T]
> {
  constructor(public readonly name_: T) {}
  public get name() {
    return this.name_.toString()
  }
  public sync(...p: Parameters<FT>): ReturnType<Awaited<FT>> {
    const r = window.inject.injectFunction.sync(this.name, ...p)
    if (r.isError) throw r.result
    return r.result
  }
  public async call(...p: Parameters<FT>): Promise<ReturnType<FT>> {
    const r = await window.inject.injectFunction.call(this.name, ...p)
    if (r.isError) throw r.result
    return r.result
  }
  public static from<
    TGlobal extends Record<string, AnyFn>,
    T extends keyof TGlobal,
    FT extends (...args: any) => any = TGlobal[T]
  >(name: T) {
    const injectFunction = new InjectFunction(name.toString())
    return (...p: Parameters<FT>) => injectFunction.call(...p)
  }
  public static fromSync<
    TGlobal extends Record<string, AnyFn>,
    T extends keyof TGlobal,
    FT extends (...args: any) => any = TGlobal[T]
  >(name: T) {
    const injectFunction = new InjectFunction(name.toString())
    return (...p: Parameters<FT>) => injectFunction.sync(...p)
  }
}