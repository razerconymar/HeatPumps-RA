#!/usr/bin/env node
// Build data/engine/indiana-engine-data.json from Riley's processed tables.
//
//   node scripts/build-engine-data.mjs "../Heat Pump Calculator code and data (2026-09-25)/data/processed"
//
// Reads the same CSVs that Riley's build_workbook.py pastes into the workbook (Stations, County Map,
// Weather/Wind/Humidity/Daylight/Sun Data, ENERGY STAR medians), keeps only what the engine needs, and
// writes one small JSON file that ships with the site. Rerun it whenever Riley updates his data.
import fs from "node:fs";
import path from "node:path";

const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/build-engine-data.mjs <path to Riley's data/processed>");
  process.exit(1);
}
const out = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "data", "engine",
  "indiana-engine-data.json");

function readCsv(name) {
  const text = fs.readFileSync(path.join(src, name), "utf8").replace(/^﻿/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.length);
  const parse = (line) => {
    const cells = [];
    let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    return cells;
  };
  const head = parse(lines[0]);
  return lines.slice(1).map((l) => Object.fromEntries(parse(l).map((v, i) => [head[i], v])));
}

const BIN_TEMPS = Array.from({ length: 29 }, (_, i) => -30 + 5 * i);
const bins = (r) => BIN_TEMPS.map((t) => Number(r[String(t)]));
const num = (v) => (v === "" || v === undefined ? null : Number(v));

const counties = {};
for (const r of readCsv("county_station.csv")) {
  counties[r.county] = {
    fips: r.fips, stationId: r.station_id, station: r.station,
    distanceMi: Number(r.distance_mi), farMatch: r.far_match.trim() !== "",
  };
}
const used = new Set(Object.values(counties).map((c) => c.stationId));

const stations = {};
for (const r of readCsv("stations.csv")) {
  if (!used.has(r.station_id)) continue;
  stations[r.station_id] = {
    name: r.station, usableYears: Number(r.usable_years),
    hdd65: { Average: num(r.HDD65_average), Mild: num(r.HDD65_mild), Extreme: num(r.HDD65_extreme) },
    mildYear: r.mild_year, extremeYear: r.extreme_year,
    heatingDesignF: num(r.heating_design_99pct_F), coolingDesignF: num(r.cooling_design_1pct_F),
  };
}

const hours = {};
for (const r of readCsv("weather_bins.csv")) if (used.has(r.station_id)) hours[`${r.station_id}|${r.scenario}`] = bins(r);

const windRows = readCsv("wind_bins.csv");
const windStatewide = bins(windRows.find((r) => r.station_id === "STATEWIDE"));

const humidity = {}, daylight = {}, daylightSeason = {};
for (const r of readCsv("humidity_bins.csv")) if (used.has(r.station_id)) humidity[r.station_id] = bins(r);
for (const r of readCsv("daylight_bins.csv")) {
  if (!used.has(r.station_id)) continue;
  daylight[r.station_id] = bins(r);
  daylightSeason[r.station_id] = [Number(r.heating_season_daylight_share), Number(r.cooling_season_daylight_share)];
}

const solar = readCsv("solar_vertical.csv").map((r) => ({
  city: r.city, wall: r.wall, heatingSeason: Number(r.heating_season_avg), coolingSeason: Number(r.cooling_season_avg),
  monthly: Array.from({ length: 12 }, (_, m) => Number(r[`m${String(m + 1).padStart(2, "0")}`])),
}));

const heatPumps = {};
for (const r of readCsv("heat_pump_medians.csv")) {
  const key = r.compressor.toLowerCase().startsWith("single") ? "Single-stage" : "Two-stage";
  heatPumps[key] = {
    seer2: Number(r.seer2_by_model), hspf2: Number(r.hspf2_by_model),
    cap47OverCooling: Number(r.cap47_over_cooling_by_model),
    cap17OverCap47: Number(r.cap17_over_cap47_by_model), cap5OverCap47: Number(r.cap5_over_cap47_by_model),
    copAt5F: Number(r.cop_at_5f_by_model),
  };
}

// sanity checks
for (const [name, c] of Object.entries(counties)) {
  for (const s of ["Average", "Mild", "Extreme"]) {
    const h = hours[`${c.stationId}|${s}`];
    if (!h) throw new Error(`${name}: no ${s} hours for ${c.stationId}`);
    const total = h.reduce((a, b) => a + b, 0);
    if (Math.abs(total - 8760) > 1) throw new Error(`${name} ${s}: hours sum to ${total}`);
  }
}

const data = {
  source: "Riley Welsh, Heat Pump Calculator code and data (2026-09-25), data/processed",
  builtAt: new Date().toISOString().slice(0, 10),
  binTemps: BIN_TEMPS, counties, stations, hours, windStatewide, humidity, daylight, daylightSeason, solar, heatPumps,
};
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(data));
console.log(`wrote ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} KB): ` +
  `${Object.keys(counties).length} counties, ${Object.keys(stations).length} stations`);
