import Editor from "@monaco-editor/react";

export default function CodeEditor({ content, fontSize }) {
  return (
    <div className="h-full w-full bg-[#0d1117] rounded-xl overflow-hidden border border-gray-800 shadow-xl">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={content}
        theme="vs-dark"
        options={{
          readOnly: true,
          fontSize: fontSize,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          lineNumbers: "on",
          renderLineHighlight: "all",
          cursorStyle: "line",
          padding: { top: 12 }, // 🔥 NEW
          smoothScrolling: true, // 🔥 NEW
          cursorSmoothCaretAnimation: "on", // 🔥 NEW
        }}
      />
    </div>
  );
}