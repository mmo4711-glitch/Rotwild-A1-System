/**
 * Jagdhandbuch Merschbach — HSI (Habitat Suitability Index) Engine
 * 
 * 6-Covariaten-Modell für Cervus elaphus im Hunsrück:
 * - Cover (Deckung): Waldstruktur, Kronendach
 * - Slope (Hangneigung): Energetischer Aufwand (Minetti-Gradient)
 * - Aspect (Exposition): Sonneneinstrahlung, Schneeschmelze
 * - Disturbance (Störung): Abstand zu Straßen, Windpark, Wanderwegen
 * - Forest% (Waldanteil): >40-50% optimal (Borowik et al. 2013)
 * - Edge (Randdichte): Wald-Offenland-Übergänge
 * 
 * NICHT enthalten: Water (irrelevant im mesischen Hunsrück, ~800mm/Jahr)
 * 
 * Wissenschaftliche Grundlage:
 * - Borowik et al. 2013: Waldanteil >40-50% für höchste Dichten
 * - Ebert et al. 2023: Elevation moduliert alle Effekte
 * - Malnar et al. 2015: Schnee >50cm als Migrationstrigger
 * - Swiss Green-up Study 2022: Süd-Exposition bevorzugt im Winter
 */

/**
 * Einzelner Suitability Index (0-1)
 */
export interface SuitabilityScore {
  name: string;
  value: number;
  description: string;
  improvement_potential: string;
}

/**
 * HSI-Eingabeparameter pro Zone/Zelle
 */
export interface HSIInput {
  /** Kronendach-Bedeckung (0-1) */
  canopy_cover: number;
  /** Unterholz-Dichte (0-1) */
  understory_density: number;
  /** Mittlere Hangneigung in Grad */
  slope_degrees: number;
  /** Exposition: 0=N, 90=O, 180=S, 270=W */
  aspect_degrees: number;
  /** Distanz zur nächsten Störquelle in Metern */
  disturbance_distance_m: number;
  /** Störungstyp-Intensität (0-1, 1=max Störung wie K81) */
  disturbance_intensity: number;
  /** Waldanteil in der Umgebung (300m Radius) (0-1) */
  forest_proportion: number;
  /** Wald-Offenland-Randlänge (m/ha) */
  edge_density_m_per_ha: number;
  /** Elevation in Metern */
  elevation_m: number;
}

/**
 * HSI-Ergebnis
 */
export interface HSIResult {
  /** Gesamt-HSI (0-1, geometrisches Mittel) */
  hsi: number;
  /** Qualitätsklasse */
  quality: 'optimal' | 'gut' | 'maessig' | 'schlecht' | 'ungeeignet';
  /** Einzelne Suitability-Scores */
  scores: SuitabilityScore[];
  /** Limitierender Faktor (niedrigster Score) */
  limiting_factor: SuitabilityScore;
  /** Verbesserungsvorschläge */
  recommendations: string[];
}

/**
 * SI_Cover: Deckungs-Suitability
 * Rotwild braucht Rückzugsräume (Dickungen, Stangenhölzer)
 * Optimal: 60-80% Kronendach, dichtes Unterholz
 */
function calculateSI_Cover(canopy: number, understory: number): SuitabilityScore {
  // Optimum bei 60-80% Kronendach
  let canopy_score: number;
  if (canopy < 0.3) canopy_score = canopy / 0.3 * 0.5; // Zu offen
  else if (canopy <= 0.8) canopy_score = 0.5 + (canopy - 0.3) / 0.5 * 0.5; // Steigend
  else canopy_score = 1 - (canopy - 0.8) / 0.2 * 0.3; // Zu dicht = weniger Äsung
  
  // Unterholz: monoton steigend
  const understory_score = Math.pow(understory, 0.5); // Quadratwurzel für abnehmenden Grenznutzen
  
  const value = Math.sqrt(canopy_score * understory_score); // Geometrisches Mittel
  
  return {
    name: 'Deckung (Cover)',
    value: Math.max(0, Math.min(1, value)),
    description: `Kronendach ${Math.round(canopy*100)}%, Unterholz ${Math.round(understory*100)}%`,
    improvement_potential: value < 0.5 
      ? 'Dickungspflege empfohlen — Unterbau fördern' 
      : 'Deckungsstruktur ausreichend',
  };
}

/**
 * SI_Slope: Hangneigung
 * Basierend auf Minetti-Energiekostenmodell:
 * Ebenes Gelände ist energetisch günstig, steile Hänge kosten Energie
 * Rotwild meidet >30° dauerhaft, nutzt >15° eingeschränkt
 */
function calculateSI_Slope(slope_deg: number): SuitabilityScore {
  let value: number;
  if (slope_deg <= 5) value = 1.0;
  else if (slope_deg <= 15) value = 1.0 - (slope_deg - 5) / 10 * 0.2;
  else if (slope_deg <= 25) value = 0.8 - (slope_deg - 15) / 10 * 0.4;
  else if (slope_deg <= 35) value = 0.4 - (slope_deg - 25) / 10 * 0.3;
  else value = Math.max(0.05, 0.1 - (slope_deg - 35) / 10 * 0.05);
  
  return {
    name: 'Hangneigung (Slope)',
    value,
    description: `${slope_deg}° mittlere Neigung`,
    improvement_potential: value < 0.5 
      ? 'Steiles Gelände — Hochsitze an Hangoberkante positionieren'
      : 'Gelände gut geeignet',
  };
}

/**
 * SI_Aspect: Exposition
 * Süd-/Südwest-Exposition bevorzugt im Winter (mehr Sonne, schnellere Schneeschmelze)
 * Nord-Exposition hat niedrigeren HSI im Winter
 */
function calculateSI_Aspect(aspect_deg: number): SuitabilityScore {
  // Transformiere Aspect zu Southness: cos(aspect - 180°) → 1=Süd, -1=Nord
  const southness = Math.cos((aspect_deg - 180) * Math.PI / 180);
  // Normalisiere auf 0-1
  const value = (southness + 1) / 2 * 0.6 + 0.4; // Range 0.4-1.0 (Nord nie <0.4)
  
  const direction = aspect_deg < 45 || aspect_deg > 315 ? 'Nord' :
                    aspect_deg < 135 ? 'Ost' :
                    aspect_deg < 225 ? 'Süd' : 'West';
  
  return {
    name: 'Exposition (Aspect)',
    value: Math.max(0, Math.min(1, value)),
    description: `${direction}-Exposition (${aspect_deg}°)`,
    improvement_potential: value < 0.6 
      ? 'Nord-Exposition — Winterfütterung/Windschutz erwägen'
      : 'Exposition günstig',
  };
}

/**
 * SI_Disturbance: Störungsfreiheit
 * Abstand zu Störquellen: K81, Windpark, Ausoniusweg, Siedlungen
 * Logarithmische Abnahme: Erste 200m kritisch, ab 500m fast neutral
 */
function calculateSI_Disturbance(distance_m: number, intensity: number): SuitabilityScore {
  // Effektiver Abstand (gewichtet mit Intensität)
  const effective_distance = distance_m / Math.max(0.1, intensity);
  
  let value: number;
  if (effective_distance < 50) value = 0.1;
  else if (effective_distance < 200) value = 0.1 + (effective_distance - 50) / 150 * 0.3;
  else if (effective_distance < 500) value = 0.4 + (effective_distance - 200) / 300 * 0.4;
  else value = Math.min(1, 0.8 + (effective_distance - 500) / 1000 * 0.2);
  
  return {
    name: 'Störungsfreiheit (Disturbance)',
    value: Math.max(0, Math.min(1, value)),
    description: `${Math.round(distance_m)}m zur nächsten Störquelle (Intensität ${Math.round(intensity*100)}%)`,
    improvement_potential: value < 0.5 
      ? 'Starke Störung — Ruhezone einrichten, Besucherlenkung'
      : 'Störungsniveau akzeptabel',
  };
}

/**
 * SI_Forest: Waldanteil
 * Borowik et al. 2013: Waldanteil >40-50% optimal für Rotwild
 * Sinkt bei <20% und >90% (reiner Wald ohne Äsungsflächen)
 */
function calculateSI_Forest(forest_prop: number): SuitabilityScore {
  let value: number;
  if (forest_prop < 0.2) value = forest_prop / 0.2 * 0.4;
  else if (forest_prop <= 0.5) value = 0.4 + (forest_prop - 0.2) / 0.3 * 0.6;
  else if (forest_prop <= 0.75) value = 1.0;
  else value = 1.0 - (forest_prop - 0.75) / 0.25 * 0.3; // Zu viel Wald = wenig Äsung
  
  return {
    name: 'Waldanteil (Forest%)',
    value: Math.max(0, Math.min(1, value)),
    description: `${Math.round(forest_prop*100)}% Waldanteil im 300m-Radius`,
    improvement_potential: value < 0.5 
      ? forest_prop < 0.3 ? 'Zu wenig Wald — Aufforstung/Sukzession fördern'
        : 'Zu viel geschlossener Wald — Wildwiesen anlegen (Big 3 Pflanzen)'
      : 'Waldanteil optimal',
  };
}

/**
 * SI_Edge: Randdichte (Wald-Offenland-Übergänge)
 * Rotwild nutzt bevorzugt Wald-Wiesen-Ökotone
 * Optimal: 80-150 m/ha Randlänge
 */
function calculateSI_Edge(edge_density: number): SuitabilityScore {
  let value: number;
  if (edge_density < 20) value = edge_density / 20 * 0.3;
  else if (edge_density <= 80) value = 0.3 + (edge_density - 20) / 60 * 0.5;
  else if (edge_density <= 150) value = 0.8 + (edge_density - 80) / 70 * 0.2;
  else value = Math.max(0.5, 1.0 - (edge_density - 150) / 200 * 0.5); // Zu fragmentiert
  
  return {
    name: 'Randdichte (Edge)',
    value: Math.max(0, Math.min(1, value)),
    description: `${Math.round(edge_density)} m/ha Wald-Offenland-Rand`,
    improvement_potential: value < 0.5 
      ? edge_density < 50 ? 'Zu wenig Strukturvielfalt — Waldränder buchtig gestalten'
        : 'Hohe Fragmentierung — Verbundkorridore schaffen'
      : 'Gute Randstruktur',
  };
}

/**
 * Berechne den HSI für einen Standort/Zone
 * 
 * Aggregation: Geometrisches Mittel (Standardmethode nach USFWS)
 * HSI = (SI₁ × SI₂ × SI₃ × SI₄ × SI₅ × SI₆)^(1/6)
 * 
 * Vorteil: Limitierender Faktor drückt Gesamtwert stärker als arithmetic mean
 */
export function calculateHSI(input: HSIInput): HSIResult {
  const scores = [
    calculateSI_Cover(input.canopy_cover, input.understory_density),
    calculateSI_Slope(input.slope_degrees),
    calculateSI_Aspect(input.aspect_degrees),
    calculateSI_Disturbance(input.disturbance_distance_m, input.disturbance_intensity),
    calculateSI_Forest(input.forest_proportion),
    calculateSI_Edge(input.edge_density_m_per_ha),
  ];
  
  // Geometrisches Mittel
  const product = scores.reduce((acc, s) => acc * s.value, 1);
  const hsi = Math.pow(product, 1 / scores.length);
  
  // Qualitätsklasse
  let quality: HSIResult['quality'];
  if (hsi >= 0.8) quality = 'optimal';
  else if (hsi >= 0.6) quality = 'gut';
  else if (hsi >= 0.4) quality = 'maessig';
  else if (hsi >= 0.2) quality = 'schlecht';
  else quality = 'ungeeignet';
  
  // Limitierender Faktor
  const limiting_factor = scores.reduce((min, s) => s.value < min.value ? s : min);
  
  // Empfehlungen sammeln
  const recommendations = scores
    .filter(s => s.value < 0.6)
    .sort((a, b) => a.value - b.value)
    .map(s => s.improvement_potential);
  
  return { hsi, quality, scores, limiting_factor, recommendations };
}

/**
 * Merschbach-Zonen HSI-Daten (Beispielwerte basierend auf Revierbeschreibung)
 */
export const MERSCHBACH_ZONES = {
  zone_a: {
    name: 'Zone A — Kernzone (Ruhezone)',
    area_ha: 120,
    input: {
      canopy_cover: 0.75,
      understory_density: 0.6,
      slope_degrees: 12,
      aspect_degrees: 200, // SW
      disturbance_distance_m: 600,
      disturbance_intensity: 0.3,
      forest_proportion: 0.85,
      edge_density_m_per_ha: 40,
      elevation_m: 450,
    } as HSIInput,
  },
  zone_b: {
    name: 'Zone B — Produktionszone (Jagd)',
    area_ha: 140,
    input: {
      canopy_cover: 0.55,
      understory_density: 0.4,
      slope_degrees: 8,
      aspect_degrees: 160, // SSO
      disturbance_distance_m: 300,
      disturbance_intensity: 0.5,
      forest_proportion: 0.6,
      edge_density_m_per_ha: 90,
      elevation_m: 380,
    } as HSIInput,
  },
  zone_c: {
    name: 'Zone C — Pufferzone (Grenzbereich)',
    area_ha: 52,
    input: {
      canopy_cover: 0.40,
      understory_density: 0.3,
      slope_degrees: 5,
      aspect_degrees: 90, // Ost
      disturbance_distance_m: 150,
      disturbance_intensity: 0.8,
      forest_proportion: 0.35,
      edge_density_m_per_ha: 120,
      elevation_m: 340,
    } as HSIInput,
  },
};
