export default function DevToggle({ showReal, setShowReal }) {
  return (
    <div className="toggle-container">
      <span class = "toggle-text">Code</span>
      <input
        type="checkbox"
        className="toggle-switch"
        checked={showReal}
        onChange={() => setShowReal(!showReal)}
      />
      <span class = "toggle-text">Real</span>
    </div>
  );
}
