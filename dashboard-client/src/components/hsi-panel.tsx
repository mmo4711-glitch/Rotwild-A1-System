import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";
import { type HSIResult, type HSIInput, getSILabel, getHSIColor } from "@/lib/models/hsi";

interface HSIPanelProps {
  zoneName: string;
  zoneDescription: string;
  hsiResult: HSIResult;
  input: HSIInput;
  onInputChange: (field: keyof HSIInput, value: number) => void;
}

function SIBar({ label, value }: { label: string; value: number }) {
  const color = value >= 0.7 ? "#4a9e4a" : value >= 0.4 ? "#c49a2a" : "#b44040";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono" style={{ color }}>
          {value.toFixed(2)}
        </span>
      </div>
      <div className="h-2 bg-background rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${value * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function HSIPanel({ zoneName, zoneDescription, hsiResult, input, onInputChange }: HSIPanelProps) {
  const overallColor = getHSIColor(hsiResult.overall);

  return (
    <div className="space-y-4" data-testid="hsi-panel">
      {/* Header */}
      <div>
        <h3 className="font-display text-sm font-semibold text-[#c49a2a] tracking-wide">
          {zoneName}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{zoneDescription}</p>
      </div>

      {/* Overall HSI score */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-card-border bg-background">
        <div
          className="text-3xl font-mono font-bold"
          style={{ color: overallColor }}
          data-testid="hsi-score"
        >
          {hsiResult.overall.toFixed(2)}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Gesamt-HSI</div>
          <Badge
            variant="outline"
            className="text-[10px] mt-0.5"
            style={{ borderColor: overallColor, color: overallColor }}
          >
            {hsiResult.overall >= 0.7 ? "Gut" : hsiResult.overall >= 0.4 ? "Mäßig" : "Schlecht"}
          </Badge>
        </div>
      </div>

      {/* Component bars */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-medium text-foreground">Kovariaten</h4>
        {Object.entries(hsiResult.components).map(([key, value]) => (
          <div key={key} className="relative">
            <SIBar label={getSILabel(key)} value={value} />
            {key === hsiResult.limitingFactor && (
              <Badge
                variant="outline"
                className="absolute top-0 right-0 text-[8px] px-1 py-0 border-[#b44040] text-[#b44040]"
              >
                Limitierend
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* What-if sliders */}
      <div className="space-y-3 pt-2 border-t border-card-border">
        <h4 className="text-xs font-medium text-foreground">Was-wäre-wenn Analyse</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">
              Deckung: {input.cover}%
            </Label>
            <Slider
              value={[input.cover]}
              onValueChange={([v]) => onInputChange("cover", v)}
              min={0}
              max={100}
              step={1}
              data-testid="slider-cover"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">
              Störungsabstand: {input.disturbance}m
            </Label>
            <Slider
              value={[input.disturbance]}
              onValueChange={([v]) => onInputChange("disturbance", v)}
              min={0}
              max={1000}
              step={10}
              data-testid="slider-disturbance"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">
              Waldanteil: {input.forestPct}%
            </Label>
            <Slider
              value={[input.forestPct]}
              onValueChange={([v]) => onInputChange("forestPct", v)}
              min={0}
              max={100}
              step={1}
              data-testid="slider-forest"
            />
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {hsiResult.recommendations.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-card-border">
          <h4 className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-[#c49a2a]" />
            Empfehlungen
          </h4>
          <ul className="space-y-1">
            {hsiResult.recommendations.map((rec, i) => (
              <li key={i} className="text-xs text-muted-foreground pl-3 relative">
                <span className="absolute left-0 text-[#c49a2a]">·</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
