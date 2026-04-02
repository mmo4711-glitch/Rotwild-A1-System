import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Area,
} from "recharts";
import type { MonteCarloResult } from "@/lib/models/population";

interface FanChartProps {
  mcResult: MonteCarloResult;
  K: number;
  stochastic?: boolean;
}

export function FanChart({ mcResult, K, stochastic = true }: FanChartProps) {
  const data = mcResult.years.map((year, i) => ({
    year,
    median: mcResult.median[i],
    // For bands, we use range arrays
    band95: [mcResult.p2_5[i], mcResult.p97_5[i]] as [number, number],
    band90: [mcResult.p5[i], mcResult.p95[i]] as [number, number],
    band50: [mcResult.p25[i], mcResult.p75[i]] as [number, number],
  }));

  const allValues = data.flatMap((d) => [d.band95[0], d.band95[1], K]);
  const yMin = Math.max(0, Math.min(...allValues) - 5);
  const yMax = Math.max(...allValues) + 10;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 55, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(110,30%,16%)" />
          <XAxis
            dataKey="year"
            tick={{ fill: "#8b9a7a", fontSize: 11 }}
            axisLine={{ stroke: "hsl(110,30%,16%)" }}
            label={{ value: "Jahr", position: "bottom", fill: "#8b9a7a", fontSize: 11, offset: -2 }}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fill: "#8b9a7a", fontSize: 11 }}
            axisLine={{ stroke: "hsl(110,30%,16%)" }}
            label={{
              value: "N",
              position: "insideLeft",
              fill: "#8b9a7a",
              fontSize: 12,
              angle: -90,
              offset: 5,
            }}
          />
          <Tooltip
            contentStyle={{
              background: "#1a2e1a",
              border: "1px solid #2d5016",
              borderRadius: "6px",
              color: "#e8e4d9",
              fontSize: 12,
            }}
            formatter={(value: any, name: string) => {
              if (Array.isArray(value)) {
                const labels: Record<string, string> = {
                  band95: "95% KI",
                  band90: "90% KI",
                  band50: "50% KI",
                };
                return [`${Math.round(value[0])} – ${Math.round(value[1])}`, labels[name] || name];
              }
              return [Math.round(value as number), name === "median" ? "Median" : name];
            }}
            labelFormatter={(label) => `Jahr ${label}`}
          />

          {/* 95% confidence band */}
          {stochastic && (
            <Area
              type="monotone"
              dataKey="band95"
              stroke="none"
              fill="#2d5016"
              fillOpacity={0.15}
              dot={false}
              activeDot={false}
            />
          )}

          {/* 90% confidence band */}
          {stochastic && (
            <Area
              type="monotone"
              dataKey="band90"
              stroke="none"
              fill="#3a6a1a"
              fillOpacity={0.2}
              dot={false}
              activeDot={false}
            />
          )}

          {/* 50% confidence band */}
          {stochastic && (
            <Area
              type="monotone"
              dataKey="band50"
              stroke="none"
              fill="#4a9e4a"
              fillOpacity={0.35}
              dot={false}
              activeDot={false}
            />
          )}

          {/* K line */}
          <ReferenceLine
            y={K}
            stroke="#c49a2a"
            strokeDasharray="8 4"
            strokeWidth={1.5}
            label={{
              value: `K = ${K}`,
              position: "right",
              fill: "#c49a2a",
              fontSize: 11,
            }}
          />

          {/* Median line */}
          <Line
            type="monotone"
            dataKey="median"
            stroke="#4a9e4a"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: "#4a9e4a" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-[#4a9e4a] rounded" />
          {stochastic ? "Median" : "Deterministisch"}
        </span>
        {stochastic && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-2 bg-[#4a9e4a] opacity-35 rounded-sm" />
              50% KI
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-2 bg-[#3a6a1a] opacity-20 rounded-sm" />
              90% KI
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-2 bg-[#2d5016] opacity-15 rounded-sm" />
              95% KI
            </span>
          </>
        )}
        <span className="flex items-center gap-1.5">
          <span
            className="w-4 h-0.5 rounded"
            style={{
              backgroundImage: "repeating-linear-gradient(90deg, #c49a2a 0, #c49a2a 4px, transparent 4px, transparent 8px)",
            }}
          />
          K
        </span>
      </div>
    </div>
  );
}
