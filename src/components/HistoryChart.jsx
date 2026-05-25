import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

export function HistoryChart({ data }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Delay render to let grid layout calculate dimensions
    const timer = setTimeout(() => setIsReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) return <div className="h-full w-full bg-white/5 animate-pulse rounded-2xl" />;

  return (
    <div className="h-full w-full min-h-[160px]">
      <ResponsiveContainer width="99%" height="100%" minWidth={0}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="label" 
            tick={{ fill: "#71717a", fontSize: 10 }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: "#71717a", fontSize: 10 }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            contentStyle={{
              background: "rgba(9,9,11,0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "14px",
              fontSize: "12px"
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="url(#barGradient)" animationDuration={500} />
          <defs>
            <linearGradient id="barGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.9} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
