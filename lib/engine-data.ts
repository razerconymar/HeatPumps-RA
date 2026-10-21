// The engine's data file, bundled with the site (about 40 KB).
// Rebuild with: node scripts/build-engine-data.mjs "<Riley's data/processed folder>"
import raw from "@/data/engine/indiana-engine-data.json";
import type { EngineData } from "@/lib/engine/index.ts";

export const ENGINE_DATA = raw as unknown as EngineData;
export const COUNTY_NAMES = Object.keys(ENGINE_DATA.counties).sort();
