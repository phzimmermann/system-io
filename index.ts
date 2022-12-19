export interface Effects {}
  
  export type Effect<T> = (effects: Effects) => Promise<T> | T;
  
  export type SystemIOReturn<S extends SystemIO<any>> = S extends SystemIO<
    infer R
  >
    ? R
    : never;
  
  type SystemIOAllArray<V extends any[]> = {
    [Index in keyof V]: V[Index] extends SystemIO<infer Resolved>
      ? Resolved
      : V[Index];
  };
  
  export function* ty<S extends SystemIO<any>>(
    sysIO: S
  ): Generator<S, SystemIOReturn<S>, SystemIOReturn<S>> {
    const result = yield sysIO;
    return result as SystemIOReturn<S>;
  }
  
  class SystemIO<A> {
    private effect: Effect<A>;
    constructor(effect: Effect<A>) {
      this.effect = effect;
    }
    static of<T>(val: T) {
      return new SystemIO(() => Promise.resolve(val));
    }
  
    static all<V extends any[], R extends SystemIOAllArray<V>>(
      sysIOs: readonly [...V]
    ): SystemIO<SystemIOAllArray<V>> {
      const runAll = async (effects: Effects) => {
        const results = await Promise.all(
          sysIOs.map((sysIO) => sysIO.eval(effects))
        );
        return results;
      };
      return new SystemIO(runAll) as SystemIO<R>;
    }
  
    map<B>(f: (val: A) => B): SystemIO<B> {
      const mappedEffect: Effect<B> = async (effects: Effects) => {
        const unwrappedVal: A = await this.effect(effects);
        return f(unwrappedVal);
      };
      return new SystemIO(mappedEffect);
    }
  
    flatMap<B>(f: (val: A) => SystemIO<B>): SystemIO<B> {
      const boundEffect: Effect<B> = async (effects: Effects) => {
        const unwrappedVal: A = await this.effect(effects);
        const mappedIO: SystemIO<B> = f(unwrappedVal);
        return mappedIO.effect(effects);
      };
  
      return new SystemIO(boundEffect);
    }
  
    eval(effects: Effects): Promise<A> | A {
      return this.effect(effects);
    }
    isSystemIO = true;
  }
  
  export default SystemIO;
  
  export const _do = <T, Args extends any[]>(
    fn: (...args: Args) => Generator<SystemIO<any>, T | SystemIO<T>, any>
  ) => (...args: Args): SystemIO<T> => {
    const gen = fn(...args);
  
    const next = (val?: any) => {
      const res = gen.next(val);
      if (!res.done) return (res.value as SystemIO<any>).flatMap(next);
      if (
        res.value &&
        typeof res.value === "object" &&
        "isSystemIO" in res.value &&
        res.value.isSystemIO
      )
        return res.value;
      return SystemIO.of(res.value);
    };
  
    return next();
  };
  