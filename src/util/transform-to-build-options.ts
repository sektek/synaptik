type BuildFn<T> = () => T;

export type TransformToBuildOpts<T> = {
  [P in keyof T]?: T[P] | BuildFn<T[P]>;
} & {
  [key: string]: unknown;
};
