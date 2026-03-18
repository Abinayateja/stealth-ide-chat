export default function Toggle({ showReal, setShowReal }) {
  return (
    <div className="toggle">
      <span>Code</span>
      <input
        type="checkbox"
        checked={showReal}
        onChange={() => setShowReal(!showReal)}
      />
      <span>Real</span>
    </div>
  );
}