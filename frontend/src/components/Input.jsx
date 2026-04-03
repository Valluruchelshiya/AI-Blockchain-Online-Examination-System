export default function Input({ label, ...props }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <input className="input" {...props} />
    </div>
  );
}
