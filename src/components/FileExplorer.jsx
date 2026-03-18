export default function FileExplorer({ setActiveFile }) {
  const tree = [
    { name: "src", type: "folder" },
    { name: "  App.jsx", type: "file" },
    { name: "  components", type: "folder" },
    { name: "    Editor.jsx", type: "file" },
    { name: "    Toggle.jsx", type: "file" },
    { name: "  utils", type: "folder" },
    { name: "    encodeDecode.js", type: "file" },
    { name: "messages.dev", type: "file" },
  ];

  return (
    <div className="sidebar">
      <div className="explorer-title">EXPLORER</div>
      {tree.map((item, i) => (
        <div
          key={i}
          className={`file ${item.type}`}
          onClick={() =>
            item.type === "file" &&
            setActiveFile(item.name.trim())
          }
        >
          {item.name}
        </div>
      ))}
    </div>
  );
}