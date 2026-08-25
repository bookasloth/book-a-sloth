export default function SlideShell({ eyebrow, children, className = '' }) {
  return (
    <section className="h-full w-full overflow-y-auto overflow-x-hidden">
      <div className="min-h-full grid place-items-center px-5 py-16 sm:py-20">
        <div className={`w-full ${className}`} style={{ maxWidth: 'min(100%, 64rem)' }}>
          {eyebrow && (
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
