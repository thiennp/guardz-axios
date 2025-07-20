/**
 * Utility type to infer the data type from a TypeGuardFn
 */
export type InferDataType<T> = T extends (
  value: any,
  ...args: any[]
) => value is infer U
  ? U
  : never;
