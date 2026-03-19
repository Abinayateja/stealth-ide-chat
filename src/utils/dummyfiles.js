/**
 * Dummy file contents for stealth IDE file explorer.
 * Each key maps to a filename shown in the sidebar,
 * and the value is realistic-looking code displayed in the editor.
 */

const DUMMY_APP = [
  '// App.jsx',
  'import React, { useState, useEffect, useCallback } from "react";',
  'import { createRoot } from "react-dom/client";',
  '',
  '/**',
  ' * Application Entry Point',
  ' */',
  '',
  'export default function App() {',
  '  return "Ready";',
  '}',
].join('\n');

const DUMMY_EDITOR = [
  '// Editor.jsx',
  'import React from "react";',
  '',
  'export default function Editor({ content }) {',
  '  return (',
  '    <pre>',
  '      <code>{content}</code>',
  '    </pre>',
  '  );',
  '}',
].join('\n');

const DUMMY_TOGGLE = [
  '// Toggle.jsx',
  'import React from "react";',
  '',
  'export default function Toggle() {',
  '  return <div>Toggle</div>;',
  '}',
].join('\n');

const DUMMY_ENCODE_DECODE = [
  '// encodeDecode.js',
  '',
  'export const encodeMessage = (msg, id) => {',
  '  const varName = `data_${id}`;',
  '  return `export const msg_${id} = () => {',
  '    const ${varName} = "${btoa(msg)}";',
  '    return atob(${varName});',
  '  };`;',
  '};',
  '',
  'export const decodeMessage = (encoded) => {',
  '  try {',
  '    const match = encoded.match(/"(.*?)"/);',
  '    return match ? atob(match[1]) : "";',
  '  } catch {',
  '    return "";',
  '  }',
  '};',
].join('\n');


// ✅ FINAL EXPORT (FIXED — PURE JS)
export const dummyFileContents = {
  "App.jsx": DUMMY_APP,
  "Editor.jsx": DUMMY_EDITOR,
  "Toggle.jsx": DUMMY_TOGGLE,
  "encodeDecode.js": DUMMY_ENCODE_DECODE,
};