declare module "react" {
  export type ReactNode = unknown;
  export type SetStateAction<S> = S | ((previousState: S) => S);
  export type Dispatch<A> = (value: A) => void;

  export interface FunctionComponent<P = {}> {
    (props: P & { children?: ReactNode }): unknown;
  }

  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];

  const React: {
    StrictMode: FunctionComponent;
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
