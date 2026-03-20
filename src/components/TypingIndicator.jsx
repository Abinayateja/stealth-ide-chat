export default function DevTypingIndicator({ visible }) {
  if (!visible) return null;

  return (
    <div className="typing-indicator">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-label">peer is typing</span>
    </div>
  );
}
