/**
 * Habitat Suitability Index (HSI) model for Merschbach
 * 6-covariate geometric mean approach
 */

export interface HSIInput {
  cover: number;        // Deckung: canopy/understory cover %
  slope: number;        // Hangneigung: slope in degrees
  aspect: number;       // Exposition: aspect in degrees (0=N, 90=E, 180=S, 270=W)
  disturbance: number;  // Störung: distance to disturbance in meters
  forestPct: number;    // Waldanteil: forest proportion %
  edgeDensity: number;  // Randdichte: edge density m/ha
}

export interface HSIResult {
  overall: number;
  components: {
    cover: number;
    slope: number;
    aspect: number;
    disturbance: number;
    forestPct: number;
    edgeDensity: number;
  };
  limitingFactor: string;
  recommendations: string[];
}

// Individual SI functions (0–1 scale)

function siCover(coverPct: number): number {
  // Optimal: 40-70% cover
  if (coverPct < 10) return 0.1;
  if (coverPct < 40) return 0.1 + 0.9 * ((coverPct - 10) / 30);
  if (coverPct <= 70) return 1.0;
  if (coverPct <= 90) return 1.0 - 0.3 * ((coverPct - 70) / 20);
  return 0.7;
}

function siSlope(slopeDeg: number): number {
  // Moderate slopes preferred (5-25°)
  if (slopeDeg < 5) return 0.6;
  if (slopeDeg < 15) return 0.6 + 0.4 * ((slopeDeg - 5) / 10);
  if (slopeDeg <= 25) return 1.0;
  if (slopeDeg <= 40) return 1.0 - 0.5 * ((slopeDeg - 25) / 15);
  return 0.5;
}

function siAspect(aspectDeg: number): number {
  // South-facing slopes preferred (thermal advantage)
  const rad = (aspectDeg * Math.PI) / 180;
  return 0.5 + 0.5 * Math.cos(rad - Math.PI); // max at 180° (south)
}

function siDisturbance(distanceM: number): number {
  // Further from disturbance is better
  if (distanceM < 50) return 0.1;
  if (distanceM < 200) return 0.1 + 0.5 * ((distanceM - 50) / 150);
  if (distanceM < 500) return 0.6 + 0.4 * ((distanceM - 200) / 300);
  return 1.0;
}

function siForest(forestPct: number): number {
  // Optimal: 50-80% forest
  if (forestPct < 20) return 0.2;
  if (forestPct < 50) return 0.2 + 0.8 * ((forestPct - 20) / 30);
  if (forestPct <= 80) return 1.0;
  if (forestPct <= 100) return 1.0 - 0.2 * ((forestPct - 80) / 20);
  return 0.8;
}

function siEdge(edgeDensity: number): number {
  // Optimal: 40-80 m/ha (ecotone)
  if (edgeDensity < 10) return 0.2;
  if (edgeDensity < 40) return 0.2 + 0.8 * ((edgeDensity - 10) / 30);
  if (edgeDensity <= 80) return 1.0;
  if (edgeDensity <= 120) return 1.0 - 0.3 * ((edgeDensity - 80) / 40);
  return 0.7;
}

/**
 * Calculate HSI using geometric mean
 */
export function calculateHSI(input: HSIInput): HSIResult {
  const components = {
    cover: siCover(input.cover),
    slope: siSlope(input.slope),
    aspect: siAspect(input.aspect),
    disturbance: siDisturbance(input.disturbance),
    forestPct: siForest(input.forestPct),
    edgeDensity: siEdge(input.edgeDensity),
  };
  
  // Geometric mean
  const values = Object.values(components);
  const product = values.reduce((acc, v) => acc * Math.max(v, 0.001), 1);
  const overall = Math.pow(product, 1 / values.length);
  
  // Find limiting factor
  const entries = Object.entries(components);
  entries.sort((a, b) => a[1] - b[1]);
  const limitingFactor = entries[0][0];
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (components.cover < 0.5) {
    recommendations.push('Unterpflanzungen anlegen, um Deckungsgrad zu erhöhen');
  }
  if (components.disturbance < 0.5) {
    recommendations.push('Ruhezonen einrichten, Wanderwege verlegen');
  }
  if (components.forestPct < 0.5) {
    recommendations.push('Waldumbau fördern, Aufforstungsflächen erweitern');
  }
  if (components.edgeDensity < 0.5) {
    recommendations.push('Waldränder strukturieren, Ökotonbereiche schaffen');
  }
  if (overall >= 0.7) {
    recommendations.push('Habitatqualität gut — Erhaltungsmaßnahmen fortführen');
  }
  if (overall < 0.4) {
    recommendations.push('Habitatqualität kritisch — Sofortmaßnahmen erforderlich');
  }
  
  return { overall, components, limitingFactor, recommendations };
}

// Zone data for Merschbach
export interface ZoneData {
  id: string;
  name: string;
  description: string;
  input: HSIInput;
  color: string;
}

export const MERSCHBACH_ZONES: ZoneData[] = [
  {
    id: 'zone-a',
    name: 'Zone A — Kerngebiet',
    description: 'Hochwaldgebiet mit dichtem Baumbestand und geringer Störung',
    input: {
      cover: 65,
      slope: 18,
      aspect: 160,
      disturbance: 450,
      forestPct: 82,
      edgeDensity: 55,
    },
    color: '#4a9e4a',
  },
  {
    id: 'zone-b',
    name: 'Zone B — Randbereich',
    description: 'Übergangszone zwischen Wald und landwirtschaftlicher Fläche',
    input: {
      cover: 40,
      slope: 12,
      aspect: 210,
      disturbance: 250,
      forestPct: 55,
      edgeDensity: 78,
    },
    color: '#c49a2a',
  },
  {
    id: 'zone-c',
    name: 'Zone C — Offenland',
    description: 'Landwirtschaftliche Fläche mit wenig Deckung, hohe Störung',
    input: {
      cover: 15,
      slope: 5,
      aspect: 90,
      disturbance: 100,
      forestPct: 20,
      edgeDensity: 30,
    },
    color: '#8B6914',
  },
];

/**
 * Get HSI color based on value
 */
export function getHSIColor(hsi: number): string {
  if (hsi >= 0.7) return '#4a9e4a';
  if (hsi >= 0.4) return '#c49a2a';
  return '#b44040';
}

/**
 * Get SI label in German
 */
export function getSILabel(key: string): string {
  const labels: Record<string, string> = {
    cover: 'Deckung',
    slope: 'Hangneigung',
    aspect: 'Exposition',
    disturbance: 'Störung',
    forestPct: 'Waldanteil',
    edgeDensity: 'Randdichte',
  };
  return labels[key] || key;
}
