declare module "react-dom" {
  import type * as React from "react";

  export function createPortal(
    children: React.ReactNode,
    container: Element | DocumentFragment,
    key?: null | string,
  ): React.ReactPortal;
}
