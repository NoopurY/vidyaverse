"use client";

import { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { geoIdentity } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection } from "geojson";
import { Skeleton } from "../ui";

type StateDatum = { state: string; code: string; fillPct: number; flags: number; institutions: number; enrolled: number };

const W = 520;
const H = 580;

function colourFor(metric: "fill" | "flags", d?: StateDatum) {
  if (!d) return "#EEF1F5";
  if (metric === "fill") {
    if (d.fillPct >= 100) return "#C62828";
    if (d.fillPct >= 90) return "#E6A700";
    if (d.fillPct >= 70) return "#3A68B5";
    return "#9DB5DF";
  }
  if (d.flags >= 60) return "#C62828";
  if (d.flags >= 20) return "#E6A700";
  if (d.flags > 0) return "#9DB5DF";
  return "#D7E7D2";
}

/** India state map (CC-BY-4.0 outlines, planar TopoJSON in /public) – click a state to drill down */
export function IndiaMap({ data, metric, selected, onSelect }: { data: StateDatum[]; metric: "fill" | "flags"; selected?: string | null; onSelect: (state: string | null) => void }) {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [hover, setHover] = useState<StateDatum | { state: string } | null>(null);
  useEffect(() => {
    fetch("/maps/india-states.topo.json")
      .then((r) => r.json())
      .then((topo: Topology) => setGeo(feature(topo, topo.objects.states as GeometryCollection) as unknown as FeatureCollection));
  }, []);
  const projection = useMemo(() => (geo ? geoIdentity().reflectY(true).fitSize([W, H], geo) : null), [geo]);
  const byCode = useMemo(() => new Map(data.map((d) => [d.code, d])), [data]);

  if (!geo || !projection) return <Skeleton className="h-[420px] w-full" />;
  return (
    <div className="relative">
      <ComposableMap width={W} height={H} projection={projection as never} className="h-auto w-full max-h-[460px]" role="img" aria-label="Map of India by state">
        <Geographies geography={geo}>
          {({ geographies }) =>
            geographies.map((g) => {
              const code = String(g.properties.id);
              const d = byCode.get(code);
              const isSel = selected && d?.state === selected;
              return (
                <Geography
                  key={g.rsmKey}
                  geography={g}
                  tabIndex={d ? 0 : -1}
                  aria-label={d ? `${d.state}: fill ${d.fillPct.toFixed(0)}%, ${d.flags} flags. Press Enter to drill down.` : String(g.properties.name)}
                  onMouseEnter={() => setHover(d ?? { state: String(g.properties.name) })}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(d ?? null)}
                  onClick={() => d && onSelect(isSel ? null : d.state)}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && d && onSelect(isSel ? null : d.state)}
                  style={{
                    default: { fill: colourFor(metric, d), stroke: isSel ? "#0B3D91" : "#FFFFFF", strokeWidth: isSel ? 2 : 0.6, outline: "none", cursor: d ? "pointer" : "default" },
                    hover: { fill: d ? "#082F6E" : "#E2E6EC", stroke: "#FFFFFF", strokeWidth: 0.6, outline: "none", cursor: d ? "pointer" : "default" },
                    pressed: { fill: "#082F6E", outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      <div className="pointer-events-none absolute left-2 top-2 min-h-[44px] rounded border border-line bg-white/95 px-3 py-2 text-xs shadow-card">
        {hover && "fillPct" in hover ? (
          <>
            <p className="font-semibold">{hover.state}</p>
            <p className="text-muted">
              {hover.institutions} institutions · {hover.enrolled.toLocaleString("en-IN")} enrolled · fill {hover.fillPct.toFixed(1)}% · {hover.flags} flags
            </p>
          </>
        ) : hover ? (
          <p className="text-muted">{hover.state}: no institutions in scope</p>
        ) : (
          <p className="text-muted">Hover or focus a state · click to drill down</p>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted" aria-hidden>
        {(metric === "fill"
          ? [["#9DB5DF", "< 70%"], ["#3A68B5", "70–89%"], ["#E6A700", "≥ 90% (near limit)"], ["#C62828", "≥ 100%"]]
          : [["#D7E7D2", "No flags"], ["#9DB5DF", "1–19"], ["#E6A700", "20–59"], ["#C62828", "60+"]]
        ).map(([c, l]) => (
          <span key={l} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm" style={{ background: c }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
