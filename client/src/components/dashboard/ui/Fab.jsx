import { cn } from './cn';

/**
 * Floating Action Button — mobile-only primary action (e.g. "Add service").
 * Fixed bottom-right, floating above the mobile bottom tab bar and safe-area.
 * Hidden on md+ where a header/toolbar action is used instead.
 *
 * Render as a <button> (onClick) or pass `as` (e.g. Link) for navigation.
 */
export function Fab({ as: Tag = 'button', icon: Icon, label, className = '', ...props }) {
  return (
    <Tag
      aria-label={label}
      title={label}
      className={cn(
        'fixed right-4 z-30 flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-white md:hidden',
        'bottom-[calc(4.5rem+env(safe-area-inset-bottom))]',
        'shadow-[0_8px_24px_-6px_rgba(254,81,0,0.5)] transition-transform active:scale-95',
        label ? 'font-semibold' : 'w-14 justify-center px-0',
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-6 w-6 shrink-0" strokeWidth={2} />}
      {label && <span className="text-sm">{label}</span>}
    </Tag>
  );
}

export default Fab;
