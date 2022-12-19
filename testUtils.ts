import SystemIO, { Effects, SystemIOReturn } from "./index";

const runTestOnSystemIO = <S extends SystemIO<any>>(
  systemIO: S,
  effects: Partial<Effects>
): Promise<SystemIOReturn<S>> => {
  const mockEffects = new Proxy(effects, {
    get(target, name, receiver) {
      if (name in target) {
        return target[name];
      }
      throw new Error("Please define " + String(name) + " effect!");
    }
  });
  return Promise.resolve(systemIO.eval(mockEffects as Effects));
};

export default runTestOnSystemIO;
