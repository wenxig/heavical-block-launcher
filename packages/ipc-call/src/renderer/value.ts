import mitt from 'mitt'
import { onUnmounted, ref, watch, type Ref } from 'vue'

const sharedValueLocal = mitt<{ changed: [name: string, value: Ref] }>()
export const createShareValue =
  <TGlobal extends Record<string, any>>() =>
  <T extends keyof TGlobal, VT = TGlobal[T]>(name_: T) => {
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