import { useState } from "react";

const tree = [
  {
    name: "src", type: "folder", children: [
      {
        name: "components", type: "folder", children: [
          { name: "Header.jsx", type: "file" },
          { name: "AuthContext.jsx", type: "file" },
          { name: "FileExplorer.jsx", type: "file" },
          { name: "Editor.jsx", type: "file" },
          { name: "Toggle.jsx", type: "file" },
        ]
      },
      {
        name: "hooks", type: "folder", children: []
      },
      {
        name: "utils", type: "folder", children: [
          { name: "encodeDecode.js", type: "file" },
          { name: "firebaseClient.js", type: "file" },
          { name: "helpers.js", type: "file" },
        ]
      },
      { name: "App.jsx", type: "file" },
      { name: "App.css", type: "file" },
      { name: "index.css", type: "file" },
      { name: "main.js", type: "file" },
    ]
  },
  { name: "messages.dev", type: "file" },
  { name: ".env", type: "file" },
];

const FILE_ICONS = {
  jsx: "⚛️",
  js: "📜",
  css: "🎨",
  json: "📋",
  md: "📝",
  env: "🔒",
  dev: "💬",
};

function getIcon(name) {
  if (name === ".env") return "🔒";
  const ext = name.split(".").pop();
  return FILE_ICONS[ext] || "📄";
}

function TreeNode({ item, depth, activeFile, onFileClick, collapsed, toggleFolder }) {
  const isFolder = item.type === "folder";
  const isOpen = !collapsed[item.name];
  const isActive = activeFile === item.name;

  return (
    <>
      <div
        className={`file-item ${isFolder ? "folder-item" : "file-type"} ${isActive ? "active" : ""}`}
        style={{ paddingLeft: depth * 16 + 12 }}
        onClick={() => {
          if (isFolder) {
            toggleFolder(item.name);
          } else {
            onFileClick(item.name);
          }
        }}
      >
        {isFolder ? (
          <span className="folder-arrow">{isOpen ? "▾" : "▸"}</span>
        ) : null}
        <span className="file-icon">{isFolder ? "📁" : getIcon(item.name)}</span>
        <span className="file-label">{item.name}</span>
      </div>
      {isFolder && isOpen && item.children && item.children.map((child, i) => (
        <TreeNode
          key={child.name + i}
          item={child}
          depth={depth + 1}
          activeFile={activeFile}
          onFileClick={onFileClick}
          collapsed={collapsed}
          toggleFolder={toggleFolder}
        />
      ))}
    </>
  );
}

export default function DevFileExplorer({ setActiveFile, activeFile, onOpenTab }) {
  const [collapsed, setCollapsed] = useState({});

  const toggleFolder = (name) => {
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleFileClick = (name) => {
    setActiveFile(name);
    onOpenTab?.(name);
  };

  return (
    <div className="sidebar">
      <div className="explorer-header">
        <div className="explorer-title">Explorer</div>
      </div>
      <div className="explorer-section">
        <span className="section-label">PROJECT-ALPHA</span>
      </div>
      <div className="file-tree">
        {tree.map((item, i) => (
          <TreeNode
            key={item.name + i}
            item={item}
            depth={0}
            activeFile={activeFile}
            onFileClick={handleFileClick}
            collapsed={collapsed}
            toggleFolder={toggleFolder}
          />
        ))}
      </div>
    </div>
  );
}
