// Brand-icon paths (simple-icons, 24x24, fill=currentColor) — matches Footer.jsx.
const ICONS = {
  linkedin: {
    label: "LinkedIn",
    d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  facebook: {
    label: "Facebook",
    d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
};

const SLOTH_ICON = "/favicon-96x96.png";

/**
 * LinkedIn · Facebook · Sloth (their Book A Sloth page) icon row.
 * Icons only — no buttons. Placeholder ("#") hrefs still render so the
 * row is visible; they just don't navigate until real URLs are wired in.
 */
export default function TeamSocials({ socials = [], name = "" }) {
  if (!socials.length) return null;

  return (
    <div className="mt-4 flex items-center gap-2.5">
      {socials.map((s) => {
        const isSloth = s.type === "sloth";
        const meta = ICONS[s.type];
        const placeholder = !s.href || s.href === "#";
        const label = isSloth ? `${name} on Book A Sloth` : `${name} on ${meta?.label || s.type}`;
        return (
          <a
            key={s.type}
            href={s.href || "#"}
            aria-label={label}
            onClick={placeholder ? (e) => e.preventDefault() : undefined}
            {...(placeholder ? {} : { target: "_blank", rel: "noopener noreferrer" })}
            className={`flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink/55 transition-colors hover:border-primary/40 hover:text-primary ${
              placeholder ? "cursor-default opacity-60" : ""
            }`}
          >
            {isSloth ? (
              <img src={SLOTH_ICON} alt="" className="h-[18px] w-[18px] rounded-[4px]" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="currentColor" aria-hidden="true">
                <path d={meta?.d} />
              </svg>
            )}
          </a>
        );
      })}
    </div>
  );
}
