import mitt from 'mitt'
import { onUnmounted, ref, watch, type Ref } from 'vue'
import type {} from 'window-manager'

import type { InjectFunctionType, SharedValueType } from '../type'

const sharedValueLocal = mitt<{ changed: [name: keyof SharedValueType, value: Ref] }>()
export const useShareValue = <T extends keyof SharedValueType, VT = SharedValueType[T]>(
  name: T
) => {
  const refValue = ref(window.inject.sharedValue.boot<VT>(name))
  const stopSync = window.inject.sharedValue.watch<VT>(name, value => {
    console.log('[useShareValue] been sync', name, value, '->', value)
    refValue.value = value
  })
  const handleLocalSync = ([name, value]: [name: keyof SharedValueType, value: Ref]) => {
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
  T extends keyof InjectFunctionType,
  FT extends (...args: any) => any = InjectFunctionType[T]
> {
  constructor(public readonly name: T) {}
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
    T extends keyof InjectFunctionType,
    FT extends (...args: any) => any = InjectFunctionType[T]
  >(name: T) {
    const injectFunction = new InjectFunction(name)
    return (...p: Parameters<FT>) => injectFunction.call(...p)
  }
  public static fromSync<
    T extends keyof InjectFunctionType,
    FT extends (...args: any) => any = InjectFunctionType[T]
  >(name: T) {
    const injectFunction = new InjectFunction(name)
    return (...p: Parameters<FT>) => injectFunction.sync(...p)
  }
}