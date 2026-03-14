import type { AnyFn } from '@vueuse/core'

declare module 'window-manager' {
  interface Inject {
    sharedValue: {
      sync(name: keyof SharedValueType, v: any): void
      boot<T>(name: keyof SharedValueType): T
      watch<T>(name: keyof SharedValueType, cb: (v: T) => void): () => void
    }
    injectFunction: {
      sync(name: keyof InjectFunctionType, ...v: any[]): InjectFunctionResult<Awaited<any>>
      call(name: keyof InjectFunctionType, ...v: any[]): Promise<InjectFunctionResult<any>>
    }
  }
}

export type InjectFunctionResult<T> =
  | { isError: false; result: T }
  | { isError: true; result: unknown }

export interface SharedValueType extends Record<string, any> {}
export interface InjectFunctionType extends Record<string, AnyFn> {}