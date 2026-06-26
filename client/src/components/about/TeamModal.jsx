import { useEffect } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight, ExternalLink } from "lucide-react";

export default function TeamModal({ member, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!member) return null;
  const page = `/${member.username}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label={member.name} className="relative grid w-full max-w-2xl gap-6 overflow-hidden rounded-[16px] bg-surface p-6 shadow-2xl sm:grid-cols-[2fr_3fr] sm:p-8">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-ink/50 hover:text-ink">
          <X className="h-5 w-5" />
        </button>
        <div className="aspect-square overflow-hidden rounded-[12px] bg-sand ring-1 ring-black/5" data-swap={member.swap}>
          <div className="flex h-full w-full items-center justify-center text-ink/30">Photo</div>
        </div>
        <div className="flex flex-col">
          <h3 className="font-heading text-2xl font-bold">{member.name}</h3>
          <p className="text-primary">{member.role}</p>
          <p className="mt-3 text-sm text-ink/70">{member.bio}</p>
          <div className="mt-4 flex gap-3">
            {member.socials.map((s, i) => (
              <a key={i} href={s.href} className="text-sm font-medium uppercase tracking-wide text-ink/50 hover:text-primary">{s.type}</a>
            ))}
          </div>
          <div className="mt-auto flex flex-wrap gap-3 pt-6">
            <Link to={page} className="btn inline-flex items-center gap-1.5 bg-primary-cta px-5 py-2.5 text-sm text-white transition-colors hover:bg-primary-dark">
              Book a session <ArrowRight size={14} />
            </Link>
            <Link to={page} className="btn btn--outline inline-flex items-center gap-1.5 px-5 py-2.5 text-sm">
              Visit their page <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
