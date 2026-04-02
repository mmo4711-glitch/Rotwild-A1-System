import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { PopulationState } from "@/lib/models/population";

interface PopulationPyramidProps {
  state: PopulationState;
  targetState?: PopulationState;
}

const MALE_COLOR = "#5b7a8a";
const FEMALE_COLOR = "#c49a2a";
const GHOST_MALE = "rgba(91,122,138,0.25)";
const GHOST_FEMALE = "rgba(196,154,42,0.25)";

export function PopulationPyramid({ state, targetState }: PopulationPyramidProps) {
  const data = [
    {
      name: "Seneszent (9+)",
      males: -Math.round(state.senescentMale),
      females: Math.round(state.senescentFemale),
      targetMales: targetState ? -Math.round(targetState.senescentMale) : 0,
      targetFemales: targetState ? Math.round(targetState.senescentFemale) : 0,
    },
    {
      name: "Prime (2–8J)",
      males: -Math.round(state.primeMale),
      females: Math.round(state.primeFemale),
      targetMales: targetState ? -Math.round(targetState.primeMale) : 0,
      targetFemales: targetState ? Math.round(targetState.primeFemale) : 0,
    },
    {
      name: "Juvenil (0–1J)",
      males: -Math.round(state.juvenilMale),
      females: Math.round(state.juvenilFemale),
      targetMales: targetState ? -Math.round(targetState.juvenilMale) : 0,
      targetFemales: targetState ? Math.round(targetState.juvenilFemale) : 0,
    },
  ];

  const maxVal = Math.max(
    ...data.flatMap((d) => [Math.abs(d.males), d.females, Math.abs(d.targetMales || 0), d.targetFemales || 0])
  );
  const domain = [-Math.ceil(maxVal * 1.2), Math.ceil(maxVal * 1.2)];

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(110,30%,16%)" horizontal={false} />
          <XAxis
            type="number"
            domain={domain}
            tickFormatter={(v: number) => `${Math.abs(v)}`}
            tick={{ fill: "#8b9a7a", fontSize: 11 }}
            axisLine={{ stroke: "hsl(110,30%,16%)" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#e8e4d9", fontSize: 11 }}
            axisLine={{ stroke: "hsl(110,30%,16%)" }}
            width={95}
          />
          <Tooltip
            contentStyle={{
              background: "#1a2e1a",
              border: "1px solid #2d5016",
              borderRadius: "6px",
              color: "#e8e4d9",
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => {
              const absVal = Math.abs(value);
              if (name === "males") return [`${absVal} ♂`, "Männlich"];
              if (name === "females") return [`${absVal} ♀`, "Weiblich"];
              if (name === "targetMales") return [`${absVal} ♂`, "Ziel ♂"];
              if (name === "targetFemales") return [`${absVal} ♀`, "Ziel ♀"];
              return [absVal, name];
            }}
          />
          <ReferenceLine x={0} stroke="#2d5016" strokeWidth={2} />
          {targetState && (
            <>
              <Bar dataKey="targetMales" fill={GHOST_MALE} barSize={20} radius={[4, 0, 0, 4]} />
              <Bar dataKey="targetFemales" fill={GHOST_FEMALE} barSize={20} radius={[0, 4, 4, 0]} />
            </>
          )}
          <Bar dataKey="males" barSize={16} radius={[4, 0, 0, 4]}>
            {data.map((_, index) => (
              <Cell key={`male-${index}`} fill={MALE_COLOR} />
            ))}
          </Bar>
          <Bar dataKey="females" barSize={16} radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={`female-${index}`} fill={FEMALE_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-1 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm" style={{ background: MALE_COLOR }} />
          Männlich
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm" style={{ background: FEMALE_COLOR }} />
          Weiblich
        </span>
        {targetState && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-sm border border-muted-foreground opacity-40" />
            Ziel
          </span>
        )}
      </div>
    </div>
  );
}
