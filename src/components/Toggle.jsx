export default function DevToggle({ showReal, setShowReal }) {
  return (
    <div className="toggle-container">
      <span className = "toggle-text">Code</span>
      <input
        type="checkbox"
        className="toggle-switch"
        checked={showReal}
        onChange={() => setShowReal(!showReal)}
      />
      <span className = "toggle-text">Real</span>
    </div>
  );
}
