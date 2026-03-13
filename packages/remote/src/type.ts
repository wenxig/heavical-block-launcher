

export type InjectFunctionResult<T> =
  | { isError: false; result: T }
  | { isError: true; result: unknown }

export interface InjectFunctionType extends Record<string, (...args: any[]) => any> {}

export type On = {
  event: {

  }
}

export interface SharedValueType {
  
}

export type Inject = {
  sharedValue: {
    sync(name: string, v: any): void
    boot<T>(name: string): T
    watch<T>(name: string, cb: (v: T) => void): () => void
  }
  injectFunction: {
    sync(name: string, ...v: any[]): InjectFunctionResult<Awaited<any>>
    call(name: string, ...v: any[]): Promise<InjectFunctionResult<any>>
  }
  event<T extends keyof On['event']>(event: T, callback: (...p: On['event'][T]) => void): () => void
}