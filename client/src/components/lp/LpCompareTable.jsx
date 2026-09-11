import { Check, X, Minus } from "lucide-react";
import { COMPARE_TM } from "./lpData";

/* Book A Sloth vs Topmate — side-by-side table for the Topmate LP.
   Data + honesty stance live in lpData.js (COMPARE_TM). Wide table scrolls
   inside its own container so the page body never scrolls sideways on mobile. */
export default function LpCompareTable() {
  return (
    <section id="compare" className="bg-canvas px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-ink sm:text-[2.8rem]">
          Book A Sloth <span className="text-neutral-400">vs</span>{" "}
          <span className="text-primary">Topmate</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-neutral-600">
          Both help you sell your time. Here&apos;s where they differ — the
          honest version, Topmate&apos;s edge included.
        </p>

        <div className="mt-10 overflow-x-auto rounded-[8px] border border-black/5 bg-white shadow-sm">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5">
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Feature
                </th>
                <th className="px-5 py-4 font-heading text-sm font-extrabold text-primary">
                  Book A Sloth 🇮🇳
                </th>
                <th className="px-5 py-4 text-sm font-semibold text-neutral-400">
                  Topmate
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_TM.map((row, i) => (
                <tr key={row.f} className={i % 2 ? "bg-primary/[0.02]" : "bg-white"}>
                  <th
                    scope="row"
                    className="px-5 py-3 text-sm font-medium text-ink"
                  >
                    {row.f}
                  </th>
                  {/* Book A Sloth cell — highlighted; ✓ when BAS wins or parity, — when Topmate leads */}
                  <td className="bg-primary/[0.06] px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      {row.win === false ? (
                        <Minus size={14} className="text-neutral-400" />
                      ) : (
                        <Check size={14} />
                      )}
                      {row.bas}
                    </span>
                  </td>
                  {/* Topmate cell — ✓ on parity or its own edge, ✗ where BAS wins */}
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-sm ${
                        row.win === true ? "text-neutral-400" : "text-neutral-600"
                      }`}
                    >
                      {row.win === true ? (
                        <X size={14} className="text-neutral-300" />
                      ) : (
                        <Check size={14} className="text-neutral-400" />
                      )}
                      {row.tm}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-center text-xs text-neutral-400">
          Compared Sep 2026 · features change — tell us at bolt@bookasloth.in if
          anything here is out of date.
        </p>
      </div>
    </section>
  );
}
