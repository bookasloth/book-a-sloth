const GRADIENTS = [
  "linear-gradient(135deg,#FFE9DD,#FFD2BC)",
  "linear-gradient(135deg,#E8EEFF,#D6E0FF)",
  "linear-gradient(135deg,#EDE7FF,#DCD0FF)",
  "linear-gradient(135deg,#E2F6F4,#CFEFEA)",
];

/**
 * Swappable placeholder tile. Round-2: replace with a real <img>.
 * `swap` is rendered as data-swap so every slot is grep-able.
 */
export default function Placeholder({ label = "", swap, shape = "tile", className = "" }) {
  const initials =
    label
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "BAS";
  const grad = GRADIENTS[(label.length || (swap ? swap.length : 0)) % GRADIENTS.length];
  const round = shape === "avatar" ? "rounded-full" : "rounded-[6px]";
  return (
    <div
      data-swap={swap}
      role="img"
      aria-label={label ? `Placeholder for ${label}` : "Placeholder image"}
      className={`relative flex items-center justify-center overflow-hidden ${round} ${className}`}
      style={{ background: grad }}
    >
      <span className="font-heading text-2xl font-extrabold text-ink/80">{initials}</span>
      <span className="absolute bottom-1 right-2 text-[9px] font-semibold uppercase tracking-wide text-ink/55">
        placeholder
      </span>
    </div>
  );
}
