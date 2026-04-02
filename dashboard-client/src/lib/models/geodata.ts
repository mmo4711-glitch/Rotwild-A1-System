/**
 * GeoJSON data for Merschbach hunting district
 * Centered on ~49.803°N, 7.006°E
 */

export interface GeoFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: {
    type: string;
    coordinates: any;
  };
}

// Boundary polygon (approximate Merschbach Jagdbezirk)
const boundary: GeoFeature = {
  type: 'Feature',
  properties: { id: 'boundary', name: 'Jagdbezirk Merschbach', type: 'boundary' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [6.996, 49.810],
      [7.002, 49.812],
      [7.010, 49.811],
      [7.016, 49.808],
      [7.018, 49.803],
      [7.016, 49.797],
      [7.010, 49.794],
      [7.004, 49.793],
      [6.998, 49.795],
      [6.994, 49.799],
      [6.993, 49.804],
      [6.996, 49.810],
    ]],
  },
};

// Zone A — Kerngebiet (core area)
const zoneA: GeoFeature = {
  type: 'Feature',
  properties: { id: 'zone-a', name: 'Zone A — Kerngebiet', type: 'zone', zoneId: 'zone-a' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [7.001, 49.808],
      [7.008, 49.809],
      [7.013, 49.807],
      [7.014, 49.803],
      [7.012, 49.800],
      [7.006, 49.799],
      [7.002, 49.801],
      [7.000, 49.804],
      [7.001, 49.808],
    ]],
  },
};

// Zone B — Randbereich
const zoneB: GeoFeature = {
  type: 'Feature',
  properties: { id: 'zone-b', name: 'Zone B — Randbereich', type: 'zone', zoneId: 'zone-b' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [6.998, 49.806],
      [7.001, 49.808],
      [7.000, 49.804],
      [7.002, 49.801],
      [7.000, 49.798],
      [6.997, 49.797],
      [6.995, 49.800],
      [6.994, 49.803],
      [6.998, 49.806],
    ]],
  },
};

// Zone C — Offenland
const zoneC: GeoFeature = {
  type: 'Feature',
  properties: { id: 'zone-c', name: 'Zone C — Offenland', type: 'zone', zoneId: 'zone-c' },
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [7.012, 49.800],
      [7.014, 49.803],
      [7.016, 49.802],
      [7.017, 49.799],
      [7.015, 49.796],
      [7.011, 49.795],
      [7.008, 49.797],
      [7.009, 49.799],
      [7.012, 49.800],
    ]],
  },
};

// Hochsitze (hunting stands)
const hochsitze: GeoFeature[] = [
  {
    type: 'Feature',
    properties: { id: 'hs-1', name: 'Hochsitz Eichengrund', type: 'hochsitz', number: 1 },
    geometry: { type: 'Point', coordinates: [7.004, 49.806] },
  },
  {
    type: 'Feature',
    properties: { id: 'hs-2', name: 'Hochsitz Bucheneck', type: 'hochsitz', number: 2 },
    geometry: { type: 'Point', coordinates: [7.009, 49.804] },
  },
  {
    type: 'Feature',
    properties: { id: 'hs-3', name: 'Hochsitz Tannenhöhe', type: 'hochsitz', number: 3 },
    geometry: { type: 'Point', coordinates: [7.013, 49.801] },
  },
  {
    type: 'Feature',
    properties: { id: 'hs-4', name: 'Hochsitz Wildwiese', type: 'hochsitz', number: 4 },
    geometry: { type: 'Point', coordinates: [6.998, 49.800] },
  },
];

// Wildkameras (trail cameras)
const wildkameras: GeoFeature[] = [
  {
    type: 'Feature',
    properties: { id: 'wk-1', name: 'Kamera Bachgrund', type: 'wildkamera', status: 'active' },
    geometry: { type: 'Point', coordinates: [7.006, 49.805] },
  },
  {
    type: 'Feature',
    properties: { id: 'wk-2', name: 'Kamera Waldrand', type: 'wildkamera', status: 'active' },
    geometry: { type: 'Point', coordinates: [7.011, 49.802] },
  },
  {
    type: 'Feature',
    properties: { id: 'wk-3', name: 'Kamera Suhle', type: 'wildkamera', status: 'inactive' },
    geometry: { type: 'Point', coordinates: [7.001, 49.802] },
  },
];

// Wildwechsel (game trails)
const wildwechsel: GeoFeature[] = [
  {
    type: 'Feature',
    properties: { id: 'ww-1', name: 'Hauptwechsel Nord', type: 'wildwechsel' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [7.002, 49.808],
        [7.005, 49.805],
        [7.008, 49.803],
        [7.010, 49.800],
      ],
    },
  },
  {
    type: 'Feature',
    properties: { id: 'ww-2', name: 'Wechsel Bachtal', type: 'wildwechsel' },
    geometry: {
      type: 'LineString',
      coordinates: [
        [6.998, 49.803],
        [7.003, 49.804],
        [7.007, 49.805],
        [7.012, 49.804],
      ],
    },
  },
];

// K81 road
const road: GeoFeature = {
  type: 'Feature',
  properties: { id: 'k81', name: 'K81', type: 'road' },
  geometry: {
    type: 'LineString',
    coordinates: [
      [6.993, 49.796],
      [6.999, 49.798],
      [7.005, 49.799],
      [7.012, 49.798],
      [7.018, 49.796],
    ],
  },
};

export const MERSCHBACH_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: [
    boundary,
    zoneA,
    zoneB,
    zoneC,
    ...hochsitze,
    ...wildkameras,
    ...wildwechsel,
    road,
  ],
};

export function getZoneFeatures(): GeoFeature[] {
  return [zoneA, zoneB, zoneC];
}

export function getHochsitze(): GeoFeature[] {
  return hochsitze;
}

export function getWildkameras(): GeoFeature[] {
  return wildkameras;
}

export function getWildwechsel(): GeoFeature[] {
  return wildwechsel;
}

export function getRoad(): GeoFeature {
  return road;
}

export function getBoundary(): GeoFeature {
  return boundary;
}
