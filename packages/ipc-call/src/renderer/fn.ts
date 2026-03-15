import type { AnyFn } from '@vueuse/core'

export class InjectFunction<
  TGlobal extends Record<any, AnyFn>,
  T extends keyof TGlobal,
  FT extends (...args: any) => any = TGlobal[T]
> {
  private constructor(public readonly name_: T) {}
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
  public static from<TGlobal extends Record<any, AnyFn>>() {
    return <T extends keyof TGlobal, FT extends (...args: any) => any = TGlobal[T]>(name: T) => {
      const injectFunction = new this<TGlobal, T, FT>(name)
      return (...p: Parameters<FT>) => injectFunction.call(...p)
    }
  }
  public static fromSync<TGlobal extends Record<any, AnyFn>>() {
    return <T extends keyof TGlobal, FT extends (...args: any) => any = TGlobal[T]>(name: T) => {
      const injectFunction = new this<TGlobal, T, FT>(name)
      return (...p: Parameters<FT>) => injectFunction.sync(...p)
    }
  }
}