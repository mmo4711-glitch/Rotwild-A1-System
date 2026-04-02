/**
 * Global Population Context — wires together population model, harvest data,
 * camera sightings, and weather so every module shares the same live state.
 */
import { createContext, useContext, useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  MERSCHBACH_DEFAULTS,
  calculateLambda,
  calculateNe,
  calculateMSY,
  estimateRMax,
  checkPhilosophyConstraints,
  totalN,
  totalMales,
  totalFemales,
  type PopulationState as PopState,
  type PopulationRates,
  type PhilosophyWarning,
} from "@/lib/models/population";
import type { Harvest, CameraSighting } from "@shared/schema";

// ── Helpers ────────────────────────────────────────────────────

function degreesToDir(deg: number): string {
  const dirs = ["N", "NO", "O", "SO", "S", "SW", "W", "NW"];
  const idx = Math.round(deg / 45) % 8;
  return dirs[idx];
}

/** Determine current hunting season (April-March) */
function currentSeasonKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  // Season runs Apr → Mar
  if (m >= 4) return `${y}/${y + 1}`;
  return `${y - 1}/${y}`;
}

// ── Harvest summary ────────────────────────────────────────────

export interface HarvestSummary {
  total: number;
  male: number;
  female: number;
  rotwild: number;
  rotwildMale: number;
  rotwildFemale: number;
  lastDate: string | null;
  lastSpecies: string | null;
}

function summariseHarvests(harvests: Harvest[]): HarvestSummary {
  const total = harvests.length;
  const male = harvests.filter((h) => h.sex === "M").length;
  const female = harvests.filter((h) => h.sex === "F").length;
  const rotwild = harvests.filter((h) => h.species === "Rotwild");
  const rotwildMale = rotwild.filter((h) => h.sex === "M").length;
  const rotwildFemale = rotwild.filter((h) => h.sex === "F").length;
  const lastDate = harvests.length > 0 ? harvests[0].date : null;
  const lastSpecies = harvests.length > 0 ? harvests[0].species : null;
  return { total, male, female, rotwild: rotwild.length, rotwildMale, rotwildFemale, lastDate, lastSpecies };
}

// ── Context shape ──────────────────────────────────────────────

export interface PopulationContextValue {
  // Current population estimate
  population: PopState;
  totalN: number;

  // Model parameters
  K: number;
  harvestRate: number;

  // Derived
  lambda: number;
  ne: number;
  neStatus: string;
  msy: { percent: number; absolute: number };
  warnings: PhilosophyWarning[];

  // Harvest data from DB
  harvests: Harvest[];
  totalHarvested: number;
  harvestedThisSeason: HarvestSummary;

  // Camera sighting index
  sightings: CameraSighting[];
  sightingIndex: number;

  // Weather
  weather: any | null;
  currentTemp: number | null;
  currentWind: string | null;
  currentWindSpeed: number | null;
  weatherCode: number | null;
  weatherLoading: boolean;

  // Setters
  setK: (k: number) => void;
  setHarvestRate: (r: number) => void;
  setInitialN: (n: number) => void;

  // Timestamp
  updatedAt: Date;

  // Recalculate (trigger)
  recalculate: () => void;
}

const PopulationContext = createContext<PopulationContextValue | null>(null);

// ── Default rates ──────────────────────────────────────────────

const defaultRates: PopulationRates = {
  survival: MERSCHBACH_DEFAULTS.survival,
  fecundity: MERSCHBACH_DEFAULTS.fecundity,
  sexRatioAtBirth: MERSCHBACH_DEFAULTS.sexRatioAtBirth,
};

// ── Provider ───────────────────────────────────────────────────

export function PopulationProvider({ children }: { children: React.ReactNode }) {
  const [K, setK] = useState(MERSCHBACH_DEFAULTS.K);
  const [harvestRate, setHarvestRate] = useState(MERSCHBACH_DEFAULTS.harvestRate);
  const [initialN, setInitialN] = useState(MERSCHBACH_DEFAULTS.initialN);
  const [tick, setTick] = useState(0);

  const recalculate = useCallback(() => setTick((t) => t + 1), []);

  // ── API: Harvests ───────────────────────────────────────────
  const { data: harvests = [] } = useQuery<Harvest[]>({
    queryKey: ["/api/harvests"],
    staleTime: 60_000,
  });

  // ── API: Camera Sightings ───────────────────────────────────
  const { data: sightings = [] } = useQuery<CameraSighting[]>({
    queryKey: ["/api/camera-sightings"],
    staleTime: 60_000,
  });

  // ── API: Weather ────────────────────────────────────────────
  const { data: weather = null, isLoading: weatherLoading } = useQuery<any>({
    queryKey: ["/api/weather"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/weather");
      return res.json();
    },
    refetchInterval: 600_000, // 10 min
    staleTime: 300_000,
  });

  // ── Harvest summary ──────────────────────────────────────────
  const harvestedThisSeason = useMemo<HarvestSummary>(() => {
    const season = currentSeasonKey();
    const [startYear] = season.split("/").map(Number);
    // Filter harvests to current season (April of startYear — March of startYear+1)
    const inSeason = harvests.filter((h) => {
      if (!h.date) return false;
      const [y, m] = h.date.split("-").map(Number);
      if (y === startYear && m >= 4) return true;
      if (y === startYear + 1 && m <= 3) return true;
      return false;
    });
    return summariseHarvests(inSeason);
  }, [harvests]);

  // ── Sighting index ──────────────────────────────────────────
  const sightingIndex = useMemo(() => {
    if (sightings.length === 0) return 0;
    // Relative activity: total Rotwild count over last 30 days vs. average
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const recent = sightings.filter((s) => {
      if (!s.date) return false;
      return new Date(s.date) >= thirtyDaysAgo;
    });
    const recentCount = recent.reduce((sum, s) => sum + (s.count ?? 1), 0);
    const totalCount = sightings.reduce((sum, s) => sum + (s.count ?? 1), 0);
    const avgPer30 = sightings.length > 0 ? (totalCount / Math.max(1, sightings.length)) * 30 : 0;
    return avgPer30 > 0 ? recentCount / avgPer30 : 0;
  }, [sightings]);

  // ── Weather derived values ───────────────────────────────────
  const currentTemp = weather?.current?.temperature_2m ?? null;
  const currentWindSpeed = weather?.current?.wind_speed_10m ?? null;
  const currentWind =
    weather?.current?.wind_direction_10m != null
      ? degreesToDir(weather.current.wind_direction_10m)
      : null;
  const weatherCode = weather?.current?.weather_code ?? null;

  // ── Population model ─────────────────────────────────────────
  const rotwildHarvested = harvestedThisSeason.rotwild;

  const population = useMemo<PopState>(() => {
    // Start from the default age structure scaled to initialN
    const ratio = initialN / MERSCHBACH_DEFAULTS.initialN;
    const base: PopState = {
      juvenilMale: Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.juvenilMale * ratio),
      juvenilFemale: Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.juvenilFemale * ratio),
      primeMale: Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.primeMale * ratio),
      primeFemale: Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.primeFemale * ratio),
      senescentMale: Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.senescentMale * ratio),
      senescentFemale: Math.round(MERSCHBACH_DEFAULTS.initialAgeStructure.senescentFemale * ratio),
    };

    // Subtract harvested Rotwild proportionally
    if (rotwildHarvested > 0) {
      const baseN = totalN(base);
      if (baseN > rotwildHarvested) {
        const factor = (baseN - rotwildHarvested) / baseN;
        base.juvenilMale = Math.max(0, Math.round(base.juvenilMale * factor));
        base.juvenilFemale = Math.max(0, Math.round(base.juvenilFemale * factor));
        base.primeMale = Math.max(0, Math.round(base.primeMale * factor));
        base.primeFemale = Math.max(0, Math.round(base.primeFemale * factor));
        base.senescentMale = Math.max(0, Math.round(base.senescentMale * factor));
        base.senescentFemale = Math.max(0, Math.round(base.senescentFemale * factor));
      }
    }

    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialN, rotwildHarvested, tick]);

  const N = totalN(population);
  const males = totalMales(population);
  const females = totalFemales(population);
  const lambda = calculateLambda(population, defaultRates, K);
  const ne = calculateNe(males, females);
  const neStatus = ne >= 50 ? "OK" : "Kritisch";
  const rMax = estimateRMax(defaultRates);
  const msy = calculateMSY(K, rMax);
  const warnings = checkPhilosophyConstraints(population, K);

  const value = useMemo<PopulationContextValue>(
    () => ({
      population,
      totalN: N,
      K,
      harvestRate,
      lambda,
      ne,
      neStatus,
      msy,
      warnings,
      harvests,
      totalHarvested: harvests.length,
      harvestedThisSeason,
      sightings,
      sightingIndex,
      weather,
      currentTemp,
      currentWind,
      currentWindSpeed,
      weatherCode,
      weatherLoading,
      setK,
      setHarvestRate,
      setInitialN,
      updatedAt: new Date(),
      recalculate,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      population, N, K, harvestRate, lambda, ne, neStatus,
      msy, warnings, harvests, harvestedThisSeason,
      sightings, sightingIndex, weather, currentTemp,
      currentWind, currentWindSpeed, weatherCode, weatherLoading,
      tick,
    ]
  );

  return (
    <PopulationContext.Provider value={value}>
      {children}
    </PopulationContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────

export function usePopulation(): PopulationContextValue {
  const ctx = useContext(PopulationContext);
  if (!ctx) {
    throw new Error("usePopulation must be used within PopulationProvider");
  }
  return ctx;
}
