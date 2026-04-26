declare module "react" {
  export type ReactNode = unknown;
  export type SetStateAction<S> = S | ((previousState: S) => S);
  export type Dispatch<A> = (value: A) => void;

  export interface FunctionComponent<P = {}> {
    (props: P & { children?: ReactNode }): unknown;
  }

  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useMemo<T>(factory: () => T, deps?: unknown[]): T;
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function lazy<T extends FunctionComponent<any>>(factory: () => Promise<{ default: T }>): T;
  export const Suspense: FunctionComponent<{ fallback?: ReactNode }>;

  const React: {
    StrictMode: FunctionComponent;
    Suspense: typeof Suspense;
    lazy: typeof lazy;
  };

  export default React;
}

declare module "react/jsx-runtime" {
  export const Fragment: unique symbol;
  export function jsx(type: unknown, props: unknown, key?: unknown): unknown;
  export function jsxs(type: unknown, props: unknown, key?: unknown): unknown;
}

declare namespace JSX {
  interface IntrinsicAttributes {
    key?: string | number;
  }

  interface IntrinsicElements {
    [elementName: string]: any;
  }
}
