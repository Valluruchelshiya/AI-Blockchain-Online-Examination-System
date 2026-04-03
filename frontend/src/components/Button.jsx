export default function Button({ children, fullWidth, ...props }) {
  return (
    <button
      className={`btn ${fullWidth ? "btn-full" : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
