/**
 * Jagdhandbuch Merschbach — GeoJSON-Daten
 * 
 * Reviergrenze und Zonen als echte GeoJSON-Features
 * Zentrum: ~49.80°N, 7.01°E (Merschbach, Hunsrück)
 * Gesamtfläche: 312 ha
 * 
 * HINWEIS: Diese Koordinaten sind Annäherungen basierend auf der Revierbeschreibung.
 * Für exakte Polygone: GPS-Aufnahme im Feld durchführen und hier ersetzen.
 * Bis dahin dienen diese als funktionale Platzhalter für die Kartenentwicklung.
 */

export const MERSCHBACH_CENTER = {
  lat: 49.803,
  lng: 7.006,
  zoom: 14,
};

export const merschbachGeoJSON: any = {
  type: 'FeatureCollection',
  features: [
    // Reviergrenze (äußeres Polygon, ~312 ha)
    {
      type: 'Feature',
      properties: {
        id: 'reviergrenze',
        name: 'Eigenjagdbezirk Merschbach',
        type: 'boundary',
        area_ha: 312,
        fill: 'transparent',
        stroke: '#2d5016',
        'stroke-width': 3,
        'stroke-dasharray': '10,5',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [6.990, 49.810], [7.000, 49.812], [7.012, 49.811],
          [7.020, 49.808], [7.023, 49.802], [7.021, 49.795],
          [7.015, 49.790], [7.005, 49.789], [6.995, 49.791],
          [6.988, 49.796], [6.987, 49.803], [6.990, 49.810],
        ]],
      },
    },
    
    // Zone A — Kernzone/Ruhezone (120 ha, Nordwest)
    {
      type: 'Feature',
      properties: {
        id: 'zone_a',
        name: 'Zone A — Kernzone (Ruhezone)',
        type: 'zone',
        area_ha: 120,
        fill: '#1a5c1a',
        'fill-opacity': 0.3,
        stroke: '#0d3d0d',
        'stroke-width': 2,
        description: 'Minimale Störung, Rückzugsraum, keine reguläre Jagd',
        hsi_target: 0.8,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [6.990, 49.810], [7.000, 49.812], [7.008, 49.810],
          [7.010, 49.804], [7.005, 49.800], [6.995, 49.800],
          [6.988, 49.803], [6.990, 49.810],
        ]],
      },
    },
    
    // Zone B — Produktionszone (140 ha, Ost/Zentral)
    {
      type: 'Feature',
      properties: {
        id: 'zone_b',
        name: 'Zone B — Produktionszone (Jagd)',
        type: 'zone',
        area_ha: 140,
        fill: '#c49a2a',
        'fill-opacity': 0.25,
        stroke: '#8b6914',
        'stroke-width': 2,
        description: 'Reguläre Jagd, Ansitz/Pirsch, Hochsitze',
        hsi_target: 0.6,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [7.008, 49.810], [7.012, 49.811], [7.020, 49.808],
          [7.023, 49.802], [7.020, 49.796], [7.012, 49.793],
          [7.005, 49.795], [7.005, 49.800], [7.010, 49.804],
          [7.008, 49.810],
        ]],
      },
    },
    
    // Zone C — Pufferzone (52 ha, Süd)
    {
      type: 'Feature',
      properties: {
        id: 'zone_c',
        name: 'Zone C — Pufferzone (Grenzbereich)',
        type: 'zone',
        area_ha: 52,
        fill: '#8b4513',
        'fill-opacity': 0.2,
        stroke: '#5c2d0e',
        'stroke-width': 2,
        description: '75m-Grenzbuffer, eingeschränkte Jagd, Wildbrücken',
        hsi_target: 0.4,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [7.005, 49.795], [7.012, 49.793], [7.020, 49.796],
          [7.021, 49.795], [7.015, 49.790], [7.005, 49.789],
          [6.995, 49.791], [6.988, 49.796], [6.995, 49.800],
          [7.005, 49.795],
        ]],
      },
    },
    
    // Hochsitz-Standorte (Beispiele — durch GPS-Daten ersetzen!)
    ...[
      { id: 'hs_01', name: 'Hochsitz Eichenberg', type_hs: 'A', lat: 49.806, lng: 7.000, notes: 'Kanzel, Typ A (geschlossen)' },
      { id: 'hs_02', name: 'Hochsitz Dhrontal', type_hs: 'B', lat: 49.802, lng: 7.010, notes: 'Leiter, Typ B (offen)' },
      { id: 'hs_03', name: 'Hochsitz Windbruch', type_hs: 'A', lat: 49.798, lng: 7.005, notes: 'Kanzel, Typ A (geschlossen)' },
      { id: 'hs_04', name: 'Hochsitz K81-Rand', type_hs: 'C', lat: 49.795, lng: 7.012, notes: 'Drückjagdschirm, Typ C' },
      { id: 'hs_05', name: 'Hochsitz Nordhang', type_hs: 'B', lat: 49.809, lng: 7.004, notes: 'Leiter, Typ B (offen)' },
    ].map(hs => ({
      type: 'Feature' as const,
      properties: {
        id: hs.id,
        name: hs.name,
        type: 'hochsitz',
        hochsitz_type: hs.type_hs,
        notes: hs.notes,
        icon: 'tower',
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [hs.lng, hs.lat],
      },
    })),
    
    // Wildkamera-Positionen
    ...[
      { id: 'wk_01', name: 'Wildkamera Hauptwechsel', lat: 49.804, lng: 7.003 },
      { id: 'wk_02', name: 'Wildkamera Suhle', lat: 49.800, lng: 7.008 },
      { id: 'wk_03', name: 'Wildkamera Wildwiese Ost', lat: 49.797, lng: 7.015 },
    ].map(wk => ({
      type: 'Feature' as const,
      properties: {
        id: wk.id,
        name: wk.name,
        type: 'wildkamera',
        icon: 'camera',
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [wk.lng, wk.lat],
      },
    })),
    
    // Wildwechsel (Hauptwechsel als Linie)
    {
      type: 'Feature',
      properties: {
        id: 'ww_main',
        name: 'Hauptwechsel Nord-Süd',
        type: 'wildwechsel',
        stroke: '#ff6b35',
        'stroke-width': 2,
        'stroke-dasharray': '5,3',
        intensity: 'hoch',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [7.002, 49.810], [7.003, 49.806], [7.005, 49.802],
          [7.006, 49.798], [7.008, 49.794], [7.010, 49.791],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'ww_ost',
        name: 'Wechsel Ost (zum Dhrontal)',
        type: 'wildwechsel',
        stroke: '#ff6b35',
        'stroke-width': 1.5,
        'stroke-dasharray': '5,3',
        intensity: 'mittel',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [7.005, 49.802], [7.010, 49.801], [7.015, 49.800],
          [7.018, 49.798],
        ],
      },
    },
    
    // Störquellen
    {
      type: 'Feature',
      properties: {
        id: 'k81',
        name: 'K81 (Kreisstraße)',
        type: 'stoerung',
        stroke: '#ff0000',
        'stroke-width': 2,
        disturbance_type: 'road',
        intensity: 0.7,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [6.988, 49.793], [7.000, 49.792], [7.015, 49.791], [7.023, 49.793],
        ],
      },
    },
    
    // Windpark (300m Eisfallzone)
    {
      type: 'Feature',
      properties: {
        id: 'windpark_buffer',
        name: 'Windpark Eisfallzone (300m)',
        type: 'restriktion',
        fill: '#ff4444',
        'fill-opacity': 0.15,
        stroke: '#ff0000',
        'stroke-width': 1,
        'stroke-dasharray': '3,3',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [7.018, 49.808], [7.022, 49.807], [7.023, 49.804],
          [7.021, 49.802], [7.017, 49.803], [7.016, 49.806],
          [7.018, 49.808],
        ]],
      },
    },
  ],
};

/**
 * GeoJSON für den Export bereitstellen
 */
export function getGeoJSONString(): string {
  return JSON.stringify(merschbachGeoJSON, null, 2);
}

/**
 * Filtere Features nach Typ
 */
export function getFeaturesByType(type: string): any[] {
  return merschbachGeoJSON.features.filter(
    (f: any) => f.properties?.type === type
  );
}
