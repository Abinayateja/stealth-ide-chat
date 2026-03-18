import Editor from "@monaco-editor/react";

export default function CodeEditor({ content, fontSize }) {
  return (
    <Editor
      height="100%"
      defaultLanguage="javascript"
      value={content}
      theme="vs-dark"
      options={{
        readOnly: true,
        fontSize: fontSize, // ✅ dynamic now
        fontFamily: "Fira Code, monospace",
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        lineNumbers: "on",
        renderLineHighlight: "all",
        cursorStyle: "line",
      }}
    />
  );
}