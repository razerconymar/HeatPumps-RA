// Every fixed value the engine uses, with the workbook's defaults (Levels, Assumptions, Equipment,
// HP Rating sheets). Same names and values as hp_engine/assumptions.py.
//
// Defaults equal the workbook on purpose so the parity tests hold. Values the team is still deciding
// (furnace AFUE, existing AC SEER2, outside shading, sizing factor, ...) are changed with withOverrides().

import type { HeatPumpRating, HPType, LevelName } from "./types.ts";

export interface InsulationLevel {
  wallFramingIn: number;
  wallCavityR: number;
  wallContinuousR: number;
  atticR: number;
  floorR: number;
  windowU: number;
  doorU: number;
  ach50: number;
  windowShgc: number;
  scaleAch50ByStories: boolean;
}

export interface GainLine {
  label: string;
  a: number; b: number; c: number;
  include: boolean;
  latA: number; latB: number; latC: number;
}

export interface BaselineRating { existing: number; new: number }

export interface Assumptions {
  levels: Record<LevelName, InsulationLevel>;
  materials: {
    outFilm: number; siding: number; sheathing: number; drywall: number; inFilmWall: number;
    inFilmCeiling: number; atticFilm: number; floorFilm: number; subfloor: number; woodRPerIn: number;
    airCavityR: number; ceilingJoistIn: number; floorJoistIn: number; insulationRPerIn: number;
    framingFractionWall: number; framingFractionCeiling: number; framingFractionFloor: number;
  };
  geometry: {
    windowFraction: number; doorAreaSqft: number; floorFramingFt: number; bufferFactor: number; airHeat: number;
    sizeTable: Record<"Small" | "Medium" | "Large", number>; defaultOneStoryMaxSqft: number; sqftPerBedroom: number;
  };
  infiltration: {
    cfmToM3s: number; refPressurePa: number; flowExponent: number; airDensity: number; m2ToIn2: number;
    storiesExponent: number;
    stackSi: [number, number, number];
    windSi: [number, number, number][];   // shelter class 1..5 x stories 1..3
  };
  gains: GainLine[];
  sun: {
    blindsWinter: number; blindsSummer: number; exteriorShading: number; kwhM2ToBtuFt2: number;
    indoorRh: number; pressureKpa: number; airLatent: number; windowsOpenF: number;
    ventilationLevels: LevelName[];
  };
  equipment: {
    afueGas: BaselineRating; afuePropane: BaselineRating; effElectric: BaselineRating; seer2Ac: BaselineRating;
    heatPumps: Record<HPType, HeatPumpRating> | null;   // null -> use the data file's ENERGY STAR medians
    btuPerTherm: number; btuPerGallonPropane: number; btuPerKwh: number;
  };
  sizing: {
    sizeFactor: number; sizeStepBtuh: number; sizeMinBtuh: number;
    fanKwhFixed: number; fanKwhPerKbtuh: number; fanReferenceHours: number; dse: number;
  };
  rating: { outdoorDesignF: number; zeroLoadF: number; slopeFactor: number; bins: [number, number][] };
}

const gain = (label: string, a: number, b: number, c: number, include: boolean, latA = 0, latB = 0, latC = 0): GainLine =>
  ({ label, a, b, c, include, latA, latB, latC });

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  levels: {
    Poor: { wallFramingIn: 3.5, wallCavityR: 0, wallContinuousR: 0, atticR: 11, floorR: 0, windowU: 0.95, doorU: 0.5,
      ach50: 20, windowShgc: 0.8, scaleAch50ByStories: true },
    Average: { wallFramingIn: 3.5, wallCavityR: 11, wallContinuousR: 0, atticR: 30, floorR: 13, windowU: 0.55, doorU: 0.5,
      ach50: 13, windowShgc: 0.7, scaleAch50ByStories: true },
    Excellent: { wallFramingIn: 5.5, wallCavityR: 20, wallContinuousR: 5, atticR: 60, floorR: 30, windowU: 0.3, doorU: 0.3,
      ach50: 3, windowShgc: 0.4, scaleAch50ByStories: false },
  },
  materials: {
    outFilm: 0.17, siding: 0.61, sheathing: 0.62, drywall: 0.45, inFilmWall: 0.68, inFilmCeiling: 0.61,
    atticFilm: 0.61, floorFilm: 0.92, subfloor: 0.93, woodRPerIn: 1.25, airCavityR: 1.0, ceilingJoistIn: 3.5,
    floorJoistIn: 9.25, insulationRPerIn: 3.0, framingFractionWall: 0.23, framingFractionCeiling: 0.11,
    framingFractionFloor: 0.13,
  },
  geometry: {
    windowFraction: 0.18, doorAreaSqft: 40, floorFramingFt: 1, bufferFactor: 0.5, airHeat: 1.08,
    sizeTable: { Small: 1200, Medium: 2000, Large: 3000 }, defaultOneStoryMaxSqft: 1500, sqftPerBedroom: 700,
  },
  infiltration: {
    cfmToM3s: 0.0004719474, refPressurePa: 4, flowExponent: 0.65, airDensity: 1.2, m2ToIn2: 1550.0031,
    storiesExponent: 0.3,
    stackSi: [0.000145, 0.00029, 0.000435],
    windSi: [
      [0.000319, 0.00042, 0.000494],
      [0.000246, 0.000325, 0.000382],
      [0.000174, 0.000231, 0.000271],
      [0.000104, 0.000137, 0.000161],
      [0.000032, 0.000042, 0.000049],
    ],
  },
  gains: [
    gain("Miscellaneous plug loads", 0, 7.27, 0, true, 0, 0.38, 0),
    gain("Interior lighting", 4253, 7.48, 0, true),
    gain("Refrigerator", 5955, 0, 168, true),
    gain("TVs", 3861, 0, 645, true),
    gain("Range/oven, electric", 2228, 0, 262, true, 248, 0, 29),
    gain("Range/oven, gas", 4086, 0, 488, false, 1037, 0, 124),
    gain("Clothes dryer, electric", 661, 0, 188, true, 73, 0, 21),
    gain("Clothes dryer, gas", 738, 0, 209, false, 91, 0, 26),
    gain("Dishwasher", 219, 0, 87, true, 219, 0, 87),
    gain("Clothes washer", 95, 0, 26, true, 11, 0, 3),
    gain("General hot water use", -1227, 0, -409, true, 1245, 0, 415),
    gain("Occupants", 0, 0, 3716, true, 0, 0, 2884),
  ],
  sun: {
    blindsWinter: 0.85, blindsSummer: 0.7, exteriorShading: 1.0, kwhM2ToBtuFt2: 317.1, indoorRh: 0.5,
    pressureKpa: 98.8, airLatent: 4840, windowsOpenF: 72, ventilationLevels: ["Excellent"],
  },
  equipment: {
    afueGas: { existing: 0.8, new: 0.95 },
    afuePropane: { existing: 0.8, new: 0.95 },
    effElectric: { existing: 1.0, new: 1.0 },
    seer2Ac: { existing: 12.4, new: 13.4 },
    heatPumps: null,
    btuPerTherm: 100000, btuPerGallonPropane: 91452, btuPerKwh: 3412.14,
  },
  sizing: {
    sizeFactor: 1.25, sizeStepBtuh: 6000, sizeMinBtuh: 18000, fanKwhFixed: 149, fanKwhPerKbtuh: 10.3,
    fanReferenceHours: 2080, dse: 0.8,
  },
  rating: {
    outdoorDesignF: 5, zeroLoadF: 55, slopeFactor: 1.15,
    bins: [[52, 0.103], [47, 0.093], [42, 0.1], [37, 0.109], [32, 0.126], [27, 0.087], [22, 0.055],
      [17, 0.036], [12, 0.026], [7, 0.013], [2, 0.006], [-3, 0.002], [-8, 0.001]],
  },
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? T[K] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** Copy of `base` with nested fields replaced, e.g. withOverrides({ sun: { exteriorShading: 0.7 } }). */
export function withOverrides(changes: DeepPartial<Assumptions>, base: Assumptions = DEFAULT_ASSUMPTIONS): Assumptions {
  return merge(base, changes) as Assumptions;
}

function merge(base: unknown, patch: unknown): unknown {
  if (patch === undefined) return base;
  if (patch === null || typeof patch !== "object" || Array.isArray(patch) || base === null || typeof base !== "object") {
    return patch;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    if (!(k in out)) throw new Error(`Unknown assumption: ${k}`);
    out[k] = merge(out[k], v);
  }
  return out;
}
