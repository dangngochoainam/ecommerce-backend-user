// TODO: what is diff between Constructor vs ConstructorFunction
// eslint-disable-next-line @typescript-eslint/ban-types
type Constructor<T> = Function & { prototype: T };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConstructorFunction<T> = new (...args: any[]) => T;
