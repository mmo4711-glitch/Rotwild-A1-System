import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HSIMap } from "@/components/hsi-map";
import { HSIPanel } from "@/components/hsi-panel";
import { calculateHSI, MERSCHBACH_ZONES, type HSIInput, type HSIResult } from "@/lib/models/hsi";
import { MapPin } from "lucide-react";

export default function Habitat() {
  const [selectedZone, setSelectedZone] = useState<string>("zone-a");
  const [zoneInputs, setZoneInputs] = useState<Record<string, HSIInput>>(() => {
    const inputs: Record<string, HSIInput> = {};
    MERSCHBACH_ZONES.forEach((z) => {
      inputs[z.id] = { ...z.input };
    });
    return inputs;
  });

  const zoneHSIs = useMemo(() => {
    const results: Record<string, HSIResult> = {};
    Object.entries(zoneInputs).forEach(([id, input]) => {
      results[id] = calculateHSI(input);
    });
    return results;
  }, [zoneInputs]);

  const handleSelectZone = useCallback((zoneId: string) => {
    setSelectedZone(zoneId);
  }, []);

  const handleInputChange = useCallback(
    (field: keyof HSIInput, value: number) => {
      if (!selectedZone) return;
      setZoneInputs((prev) => ({
        ...prev,
        [selectedZone]: { ...prev[selectedZone], [field]: value },
      }));
    },
    [selectedZone]
  );

  const selectedZoneData = MERSCHBACH_ZONES.find((z) => z.id === selectedZone);
  const selectedHSI = selectedZone ? zoneHSIs[selectedZone] : null;
  const selectedInput = selectedZone ? zoneInputs[selectedZone] : null;

  return (
    <div className="p-4 h-full flex flex-col" data-testid="page-habitat">
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="font-display text-lg font-semibold text-[#c49a2a] tracking-wide">
          Habitatbewertung
        </h2>
        <span className="text-xs text-muted-foreground">HSI-Modell · 6 Kovariaten</span>
      </div>

      <div className="flex-1 grid grid-cols-[1fr_320px] gap-3 min-h-0">
        {/* Map */}
        <Card className="bg-card border-card-border overflow-hidden">
          <CardContent className="p-0 h-full">
            <HSIMap
              zoneHSIs={zoneHSIs}
              selectedZone={selectedZone}
              onSelectZone={handleSelectZone}
            />
          </CardContent>
        </Card>

        {/* Detail panel */}
        <Card className="bg-card border-card-border overflow-y-auto">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#c49a2a]" />
              Zonendetail
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {selectedZoneData && selectedHSI && selectedInput ? (
              <HSIPanel
                zoneName={selectedZoneData.name}
                zoneDescription={selectedZoneData.description}
                hsiResult={selectedHSI}
                input={selectedInput}
                onInputChange={handleInputChange}
              />
            ) : (
              <div className="text-sm text-muted-foreground py-8 text-center">
                Zone auf der Karte auswählen
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
