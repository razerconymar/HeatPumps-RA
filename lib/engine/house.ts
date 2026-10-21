// Step 1 - House heat loss (workbook sheet: House). Port of hp_engine/house.py.
import type { Assumptions, InsulationLevel } from "./assumptions.ts";
import type { HouseInputs, LevelName } from "./types.ts";

/** Excel ROUND: halves go away from zero. */
export function excelRound(x: number): number {
  return Math.sign(x) * Math.floor(Math.abs(x) + 0.5);
}

export interface Envelope {
  rWall: number; rAttic: number; rFloor: number;
  uaWalls: number; uaWindows: number; uaDoors: number; uaAttic: number; uaFloor: number;
  ua: number;
  ach50: number; cfm50: number; elaIn2: number;
}

export interface HouseResult {
  floorArea: number;       // F5
  stories: number;         // F6
  bedrooms: number;        // F7
  level: LevelName;        // F9
  footprint: number;       // F11
  wallHeight: number;      // F14
  windowArea: number;      // F16
  netWall: number;         // F18
  volume: number;          // F21
  envelope: Envelope;      // "Your house" column
  ua: number;              // F40
  elaIn2: number;          // F44
  stackCoeff: number;      // F45
  windCoeff: number;       // F46
  internalGainBtuh: number;  // F52
  latentGainBtuh: number;    // Loads!B25
  windowShgc: number;        // Loads!B27
}

export function floorArea(inp: HouseInputs, a: Assumptions): number {
  return inp.size === "Exact" ? inp.exact_area_sqft : a.geometry.sizeTable[inp.size];
}

function envelope(lv: InsulationLevel, a: Assumptions, g: {
  netWall: number; windowArea: number; doorArea: number; ceilingArea: number; floorAreaBuf: number;
  volume: number; stories: number;
}): Envelope {
  const m = a.materials, inf = a.infiltration;
  const rStud = m.outFilm + m.siding + m.sheathing + lv.wallContinuousR + lv.wallFramingIn * m.woodRPerIn
    + m.drywall + m.inFilmWall;
  const rCav = m.outFilm + m.siding + m.sheathing + lv.wallContinuousR + Math.max(lv.wallCavityR, m.airCavityR)
    + m.drywall + m.inFilmWall;
  const rWall = 1 / (m.framingFractionWall / rStud + (1 - m.framingFractionWall) / rCav);
  const rAf = m.inFilmCeiling + m.drywall + m.ceilingJoistIn * m.woodRPerIn
    + Math.max(0, lv.atticR - m.ceilingJoistIn * m.insulationRPerIn) + m.atticFilm;
  const rAi = m.inFilmCeiling + m.drywall + Math.max(lv.atticR, m.airCavityR) + m.atticFilm;
  const rAttic = 1 / (m.framingFractionCeiling / rAf + (1 - m.framingFractionCeiling) / rAi);
  const rFj = 2 * m.floorFilm + m.subfloor + m.floorJoistIn * m.woodRPerIn;
  const rFc = 2 * m.floorFilm + m.subfloor + Math.max(lv.floorR, m.airCavityR);
  const rFloor = 1 / (m.framingFractionFloor / rFj + (1 - m.framingFractionFloor) / rFc);

  const ach50 = lv.scaleAch50ByStories ? lv.ach50 / g.stories ** inf.storiesExponent : lv.ach50;
  const cfm50 = (ach50 * g.volume) / 60;
  const ela = cfm50 * inf.cfmToM3s * (inf.refPressurePa / 50) ** inf.flowExponent
    / Math.sqrt((2 / inf.airDensity) * inf.refPressurePa) * inf.m2ToIn2;

  const uaWalls = g.netWall / rWall;
  const uaWindows = g.windowArea * lv.windowU;
  const uaDoors = g.doorArea * lv.doorU;
  const uaAttic = g.ceilingArea / rAttic;
  const uaFloor = (g.floorAreaBuf / rFloor) * a.geometry.bufferFactor;
  return {
    rWall, rAttic, rFloor, uaWalls, uaWindows, uaDoors, uaAttic, uaFloor,
    ua: uaWalls + uaWindows + uaDoors + uaAttic + uaFloor, ach50, cfm50, elaIn2: ela,
  };
}

function sumGains(a: Assumptions, cfa: number, bedrooms: number, latent: boolean): number {
  const on = a.gains.filter((l) => l.include);
  const s = (f: (l: (typeof on)[number]) => number) => on.reduce((acc, l) => acc + f(l), 0);
  return latent
    ? s((l) => l.latA) + s((l) => l.latB) * cfa + s((l) => l.latC) * bedrooms
    : s((l) => l.a) + s((l) => l.b) * cfa + s((l) => l.c) * bedrooms;
}

export function computeHouse(inp: HouseInputs, a: Assumptions): HouseResult {
  const g = a.geometry, inf = a.infiltration;
  const cfa = floorArea(inp, a);
  const stories = inp.stories ?? (cfa <= g.defaultOneStoryMaxSqft ? 1 : 2);
  const bedrooms = inp.bedrooms ?? Math.max(1, excelRound(cfa / g.sqftPerBedroom));

  const footprint = cfa / stories;
  const perimeter = 4 * Math.sqrt(footprint);
  const wallHeight = stories * inp.ceiling_ft + (stories - 1) * g.floorFramingFt;
  const grossWall = perimeter * wallHeight;
  const windowArea = g.windowFraction * cfa;
  const doorArea = g.doorAreaSqft;
  const netWall = grossWall - windowArea - doorArea;
  const volume = cfa * inp.ceiling_ft;

  const env = envelope(a.levels[inp.level], a, {
    netWall, windowArea, doorArea, ceilingArea: footprint, floorAreaBuf: footprint, volume, stories,
  });
  const sIdx = Math.min(stories, 3) - 1;
  const stackCoeff = inf.stackSi[sIdx] * ((2.11888 * 6.4516) ** 2 / 1.8);
  const windCoeff = inf.windSi[inp.shelter_class - 1][sIdx] * ((2.11888 * 6.4516) ** 2 / 2.23694 ** 2);

  return {
    floorArea: cfa, stories, bedrooms, level: inp.level, footprint, wallHeight, windowArea, netWall, volume,
    envelope: env, ua: env.ua, elaIn2: env.elaIn2, stackCoeff, windCoeff,
    internalGainBtuh: sumGains(a, cfa, bedrooms, false) / 24,
    latentGainBtuh: sumGains(a, cfa, bedrooms, true) / 24,
    windowShgc: a.levels[inp.level].windowShgc,
  };
}
