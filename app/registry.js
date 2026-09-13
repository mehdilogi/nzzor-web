"use client";

import React, { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { StyleRegistry, createStyleRegistry } from "styled-jsx";

// Collects every styled-jsx rule rendered on the server and flushes it into
// <head> before the body streams. Without this, styled-jsx inside client
// components is only injected once React hydrates on the client — the browser
// paints raw HTML first and the whole site flashes unstyled on every load.
// globals.css is unaffected; it is a render-blocking <link> and always applied.
export default function StyledJsxRegistry({ children }) {
  // Lazy initial state so the registry is created once, not on every render.
  const [jsxStyleRegistry] = useState(() => createStyleRegistry());

  useServerInsertedHTML(() => {
    const styles = jsxStyleRegistry.styles();
    jsxStyleRegistry.flush();
    return <>{styles}</>;
  });

  return <StyleRegistry registry={jsxStyleRegistry}>{children}</StyleRegistry>;
}
