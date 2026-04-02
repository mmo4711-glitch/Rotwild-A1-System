import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  getZoneFeatures,
  getHochsitze,
  getWildkameras,
  getWildwechsel,
  getRoad,
  getBoundary,
} from "@/lib/models/geodata";
import { getHSIColor, type HSIResult } from "@/lib/models/hsi";

interface HSIMapProps {
  zoneHSIs: Record<string, HSIResult>;
  selectedZone: string | null;
  onSelectZone: (zoneId: string) => void;
}

export function HSIMap({ zoneHSIs, selectedZone, onSelectZone }: HSIMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [49.803, 7.006],
      zoom: 14,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OSM",
      maxZoom: 18,
    }).addTo(map);

    mapInstance.current = map;

    // Boundary
    const boundary = getBoundary();
    L.geoJSON(boundary as any, {
      style: {
        color: "#c49a2a",
        weight: 2,
        fillOpacity: 0,
        dashArray: "6 4",
      },
    }).addTo(map);

    // Road K81
    const road = getRoad();
    L.geoJSON(road as any, {
      style: {
        color: "#b44040",
        weight: 3,
        opacity: 0.8,
      },
    })
      .bindTooltip("K81", { permanent: true, className: "road-label", direction: "center" })
      .addTo(map);

    // Wildwechsel
    const wechsel = getWildwechsel();
    wechsel.forEach((ww) => {
      L.geoJSON(ww as any, {
        style: {
          color: "#e8944a",
          weight: 2,
          dashArray: "6 3",
          opacity: 0.7,
        },
      })
        .bindTooltip(ww.properties.name, { direction: "center" })
        .addTo(map);
    });

    // Hochsitze
    const hochsitze = getHochsitze();
    hochsitze.forEach((hs) => {
      const [lng, lat] = hs.geometry.coordinates;
      L.circleMarker([lat, lng], {
        radius: 6,
        fillColor: "#c49a2a",
        color: "#0c1a0c",
        weight: 2,
        fillOpacity: 0.9,
      })
        .bindTooltip(hs.properties.name, { direction: "top" })
        .addTo(map);
    });

    // Wildkameras
    const kameras = getWildkameras();
    kameras.forEach((wk) => {
      const [lng, lat] = wk.geometry.coordinates;
      const color = wk.properties.status === "active" ? "#4a9e4a" : "#8b9a7a";
      L.circleMarker([lat, lng], {
        radius: 5,
        fillColor: color,
        color: "#0c1a0c",
        weight: 2,
        fillOpacity: 0.9,
      })
        .bindTooltip(`${wk.properties.name} (${wk.properties.status === "active" ? "aktiv" : "inaktiv"})`, {
          direction: "top",
        })
        .addTo(map);
    });

    // Zones layer group
    zonesLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update zone colors when HSI changes
  useEffect(() => {
    if (!zonesLayerRef.current || !mapInstance.current) return;
    zonesLayerRef.current.clearLayers();

    const zones = getZoneFeatures();
    zones.forEach((zone) => {
      const zoneId = zone.properties.zoneId;
      const hsiResult = zoneHSIs[zoneId];
      const hsiColor = hsiResult ? getHSIColor(hsiResult.overall) : "#8b9a7a";
      const isSelected = selectedZone === zoneId;

      const layer = L.geoJSON(zone as any, {
        style: {
          color: isSelected ? "#e8e4d9" : hsiColor,
          weight: isSelected ? 3 : 2,
          fillColor: hsiColor,
          fillOpacity: isSelected ? 0.45 : 0.3,
        },
      });

      layer.on("click", () => onSelectZone(zoneId));
      layer.bindTooltip(
        `${zone.properties.name}<br/>HSI: ${hsiResult ? hsiResult.overall.toFixed(2) : "—"}`,
        { direction: "center" }
      );
      layer.addTo(zonesLayerRef.current!);
    });
  }, [zoneHSIs, selectedZone, onSelectZone]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: 400 }}
      data-testid="hsi-map"
    />
  );
}
