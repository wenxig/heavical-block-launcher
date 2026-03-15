import type {} from 'window-manager/preload'

declare module 'window-manager/preload' {
  interface Inject {
    sharedValue: {
      sync(name: string, v: any): void
      boot<T>(name: string): T
      watch<T>(name: string, cb: (v: T) => void): () => void
    }
    injectFunction: {
      sync(name: string, ...v: any[]): InjectFunctionResult<Awaited<any>>
      call(name: string, ...v: any[]): Promise<InjectFunctionResult<any>>
    }
  }
}

export type InjectFunctionResult<T> =
  | { isError: false; result: T }
  | { isError: true; result: unknown }