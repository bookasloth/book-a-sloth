// App-wide loading spinner — a plain spinning circle (a ring with one coloured
// arc, rotating). Single source of truth for page/section loaders across the app.
// Kept the name + props so every existing caller works unchanged.
//
// `color` defaults to the brand orange; pass a host's theme_color to theme it,
// e.g. on the booking flow.
export default function PetalSpinner({
  size = 48,
  color = '#FE5100',
  className = '',
  label = 'Loading',
}) {
  const border = Math.max(2, Math.round(size / 10));
  return (
    // animate-spin === @keyframes spin { to { transform: rotate(360deg) } }.
    <span
      role="img"
      aria-label={label}
      className={`inline-block animate-spin rounded-full ${className}`.trim()}
      style={{
        width: size,
        height: size,
        borderWidth: border,
        borderStyle: 'solid',
        borderColor: `${color}26`, // track: same colour at ~15% alpha
        borderTopColor: color,     // the spinning arc
      }}
    />
  );
}
