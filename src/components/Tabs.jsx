export default function DevTabs({ tabs, activeFile, setActiveFile, onCloseTab }) {
  if (!tabs || tabs.length === 0) return null;

  const getFileIcon = (name) => {
    if (name.endsWith(".jsx")) return "⚛️";
    if (name.endsWith(".js")) return "📜";
    if (name.endsWith(".css")) return "🎨";
    if (name.endsWith(".dev")) return "💬";
    if (name === ".env") return "🔒";
    return "📄";
  };

  return (
    <div className="tabs-bar">
      {tabs.map((tab) => (
        <div
          key={tab}
          className={`tab-item ${activeFile === tab ? "tab-active" : ""}`}
          onClick={() => setActiveFile(tab)}
        >
          <span className="tab-icon">{getFileIcon(tab)}</span>
          <span className="tab-name">{tab}</span>
          <button
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(tab);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
