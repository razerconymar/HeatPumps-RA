// Types shared by the engine. Mirrors hp_engine (Python) and Riley's workbook one-to-one.

export type WeatherYear = "Average" | "Mild" | "Extreme";
export type HouseSize = "Small" | "Medium" | "Large" | "Exact";
export type LevelName = "Poor" | "Average" | "Excellent";
export type BaselineChoice = "Existing equipment" | "New replacement";
export type HPType = "Single-stage" | "Two-stage";
export type CurrentSystem = "Gas furnace + AC" | "Propane furnace + AC" | "Electric furnace + AC";

/** The workbook's Inputs sheet (B4:B17). */
export interface HouseInputs {
  county: string;
  weather_year: WeatherYear;
  size: HouseSize;
  exact_area_sqft: number;
  stories: number | null;
  bedrooms: number | null;
  ceiling_ft: number;
  level: LevelName;
  t_heat_f: number;
  t_cool_f: number;
  shelter_class: number;
  baseline: BaselineChoice;
  hp_type: HPType;
  current_system: CurrentSystem;
}

export const DEFAULT_INPUTS: HouseInputs = {
  county: "Marion",
  weather_year: "Average",
  size: "Medium",
  exact_area_sqft: 2000,
  stories: null,
  bedrooms: null,
  ceiling_ft: 8,
  level: "Average",
  t_heat_f: 68,
  t_cool_f: 78,
  shelter_class: 4,
  baseline: "Existing equipment",
  hp_type: "Single-stage",
  current_system: "Gas furnace + AC",
};

// ── data file (data/engine/indiana-engine-data.json) ──────────────────────────
export interface HeatPumpRating {
  seer2: number;
  hspf2: number;
  cap47OverCooling: number;
  cap17OverCap47: number;
  cap5OverCap47: number;
  copAt5F: number;
}

export interface EngineData {
  source: string;
  builtAt: string;
  binTemps: number[];
  counties: Record<string, { fips: string; stationId: string; station: string; distanceMi: number; farMatch: boolean }>;
  stations: Record<string, {
    name: string;
    usableYears: number;
    hdd65: Record<WeatherYear, number | null>;
    mildYear: string;
    extremeYear: string;
    heatingDesignF: number;
    coolingDesignF: number;
  }>;
  hours: Record<string, number[]>;          // "stationId|Average" -> hours per bin
  windStatewide: number[];
  humidity: Record<string, number[]>;
  daylight: Record<string, number[]>;
  daylightSeason: Record<string, [number, number]>;
  solar: { city: string; wall: string; heatingSeason: number; coolingSeason: number; monthly: number[] }[];
  heatPumps: Record<HPType, HeatPumpRating>;
}
