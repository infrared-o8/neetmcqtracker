import { buildContributionDays, getHeatmapColorClass } from "../utils/gamification";

export function ContributionGrid({ dailyLogs, dailyPageLogs, weeks = 26 }) {
  const days = buildContributionDays(dailyLogs, dailyPageLogs, weeks);

  return (
    <div className="overflow-x-auto">
      <div
        className="inline-grid gap-[3px]"
        style={{
          gridTemplateRows: "repeat(7, minmax(0, 1fr))",
          gridAutoFlow: "column",
          gridAutoColumns: "12px",
        }}
      >
        {days.map((day) => (
          <div
            key={day.key}
            title={`${day.key}: ${day.mcqs} MCQs, ${day.pages} pages`}
            className={`h-3 w-3 rounded-sm ${getHeatmapColorClass(day.intensity)} transition-colors`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-500">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-3 w-3 rounded-sm ${getHeatmapColorClass(i)}`} />
        ))}
        <span>100+ MCQ eq.</span>
      </div>
    </div>
  );
}
