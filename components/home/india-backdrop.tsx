import { readFileSync } from "fs";
import { join } from "path";
import { geoIdentity, geoPath } from "d3-geo";
import { feature, merge } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

/** Soft, decorative national silhouette (outline only – no labels, not a coverage map). */
function silhouette(w: number, h: number) {
  const topo = JSON.parse(readFileSync(join(process.cwd(), "public", "maps", "india-states.topo.json"), "utf8")) as Topology;
  const states = topo.objects.states as GeometryCollection;
  const all = feature(topo, states);
  const outline = merge(topo, states.geometries as never);
  const projection = geoIdentity().reflectY(true).fitSize([w, h], all as never);
  return geoPath(projection)(outline) ?? "";
}

export function IndiaBackdrop({ className }: { className?: string }) {
  const w = 440;
  const h = 500;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden focusable="false">
      <defs>
        <linearGradient id="vv-map" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#CFE0FA" />
          <stop offset="1" stopColor="#E6EFFD" />
        </linearGradient>
      </defs>
      <path d={silhouette(w, h)} fill="url(#vv-map)" stroke="#BFD3F3" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}
