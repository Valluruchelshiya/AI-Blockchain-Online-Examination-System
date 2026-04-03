export default function ProgressBar({ value }) {
  return (
    <div className="progress">
      <div className="progress-inner" style={{ width: `${value}%` }} />
    </div>
  );
}
