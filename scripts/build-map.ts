/**
 * Converts the CC-BY-4.0 @svg-maps/india state outlines into a planar TopoJSON
 * file served from /public/maps/india-states.topo.json (rendered with geoIdentity).
 */
import { writeFileSync } from "fs";
import { join } from "path";
import { topology } from "topojson-server";
import india from "@svg-maps/india";

type Ring = [number, number][];

function parsePath(d: string): Ring[] {
  const tokens = d.match(/[mMlLzZ]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const rings: Ring[] = [];
  let ring: Ring = [];
  let cmd = "m";
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let firstInSubpath = false;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/[mMlLzZ]/.test(t)) {
      cmd = t;
      if (t === "z" || t === "Z") {
        if (ring.length) {
          ring.push([startX, startY]);
          rings.push(ring);
        }
        ring = [];
        x = startX;
        y = startY;
      } else if (t === "m" || t === "M") {
        firstInSubpath = true;
      }
      continue;
    }
    const nx = parseFloat(t);
    const ny = parseFloat(tokens[++i]);
    const rel = cmd === "m" || cmd === "l";
    x = rel ? x + nx : nx;
    y = rel ? y + ny : ny;
    if (firstInSubpath) {
      if (ring.length) rings.push(ring);
      ring = [[x, y]];
      startX = x;
      startY = y;
      firstInSubpath = false;
      cmd = cmd === "m" ? "l" : "L";
    } else {
      ring.push([x, y]);
    }
  }
  if (ring.length > 2) rings.push(ring);
  return rings.filter((r) => r.length > 3);
}

const features = india.locations.map((loc) => ({
  type: "Feature" as const,
  id: loc.id,
  properties: { name: loc.name, id: loc.id },
  geometry: {
    type: "MultiPolygon" as const,
    // y is flipped so that geoIdentity().reflectY(true) renders north-up
    coordinates: parsePath(loc.path).map((r) => [r.map(([px, py]) => [px, -py])]),
  },
}));

const topo = topology({ states: { type: "FeatureCollection", features } as never }, 1e5);
const out = join(process.cwd(), "public", "maps", "india-states.topo.json");
writeFileSync(out, JSON.stringify(topo));
console.log(`Wrote ${features.length} states to ${out}`);
