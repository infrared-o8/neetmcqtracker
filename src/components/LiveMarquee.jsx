import React, { useState } from "react";

const MOCK_UPDATES = [
  "user_482 just broke a 45-MCQ combo in organic chemistry.",
  "aspirant_007 logged 120 pages of NCERT Biology today.",
  "neet_warrior reached AIR < 500 bracket pace.",
  "study_bot completed a 3-hour focused session.",
  "physics_pro solved 200 MCQs in Mechanics.",
  "bio_master achieved a 30-day streak.",
  "chem_ninja hit 5000 total MCQs solved.",
];

export const LiveMarquee = React.memo(function LiveMarquee() {
  const [updates] = useState(MOCK_UPDATES);

  return (
    <div className="overflow-hidden border-b border-white/5 bg-black/40 py-2">
      <div className="flex w-max animate-marquee whitespace-nowrap font-mono text-[10px] text-zinc-500 will-change-transform">
        {updates.map((update, idx) => (
          <span key={`${update}-${idx}`} className="mx-8">
            <span className="text-cyan-400">›</span> {update}
          </span>
        ))}
        {updates.map((update, idx) => (
          <span key={`${update}-dup-${idx}`} className="mx-8">
            <span className="text-cyan-400">›</span> {update}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
});
