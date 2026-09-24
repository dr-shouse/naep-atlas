"""
Build frontend/src/data/naep.json from etl/raw/naep_raw.csv.

Canonical ETL entry point (the NAEP counterpart of Sundays' trip_difficulty.py).

  - one reporting sample per state/year: R3 (accommodations permitted) when
    it is displayable, otherwise R2 (accommodations not permitted; the only
    sample before 1996). The chosen sample is kept so the UI can mark it.
  - jurisdictions that did not take part in a year are simply absent.
  - state names + label points come from etl/raw/us-states.geojson, which
    is also written (trimmed) to frontend/src/data/us-states.json.

Significance, ranks and changes are computed in the browser from the means
and standard errors, so this file stays small and the logic lives in one
place (frontend/src/lib/stats.js).

Usage:
  python build_atlas.py
"""

import csv
import datetime
import json
import math
import os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
RAW_CSV = os.path.join(HERE, "raw", "naep_raw.csv")
RAW_GEO = os.path.join(HERE, "raw", "us-states.geojson")
FRONT = os.path.join(HERE, "..", "frontend", "src", "data")

LABELS = {
    "math-4":    {"subject": "math",    "grade": 4, "label": "Grade 4 Math"},
    "math-8":    {"subject": "math",    "grade": 8, "label": "Grade 8 Math"},
    "reading-4": {"subject": "reading", "grade": 4, "label": "Grade 4 Reading"},
    "reading-8": {"subject": "reading", "grade": 8, "label": "Grade 8 Reading"},
}


def ring_centroid(ring):
    """Area-weighted centroid + |area| of a lon/lat ring (planar, fine for labels)."""
    a = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(ring, ring[1:] + ring[:1]):
        f = x0 * y1 - x1 * y0
        a += f
        cx += (x0 + x1) * f
        cy += (y0 + y1) * f
    if a == 0:
        return ring[0][0], ring[0][1], 0.0
    return cx / (3 * a), cy / (3 * a), abs(a / 2)


def _merc_y(lat):
    return math.degrees(math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)))


def _inv_merc_y(y):
    return math.degrees(2 * math.atan(math.exp(math.radians(y))) - math.pi / 2)


# Alaska and Hawaii are drawn as insets below the Southwest, the usual
# layout for state choropleths. Scaling happens in Web Mercator space so the
# shapes look right on the map. (source lon/lat centre, target lon/lat, scale)
INSETS = {
    "AK": ((-152.0, 63.5), (-113.0, 26.2), 0.36),
    "HI": ((-157.3, 20.6), (-104.0, 25.2), 1.25),
}


def inset(geom, code):
    (sx, sy), (tx, ty), k = INSETS[code]
    smy, tmy = _merc_y(sy), _merc_y(ty)

    def pt(p):
        lon, lat = p[0], p[1]
        if lon > 0:  # Aleutians past the antimeridian
            lon -= 360
        x = tx + (lon - sx) * k
        y = _inv_merc_y(tmy + (_merc_y(lat) - smy) * k)
        return [round(x, 4), round(y, 4)]

    if geom["type"] == "Polygon":
        return {"type": "Polygon", "coordinates": [[pt(p) for p in r] for r in geom["coordinates"]]}
    return {"type": "MultiPolygon",
            "coordinates": [[[pt(p) for p in r] for r in poly] for poly in geom["coordinates"]]}


def label_point(geom):
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    best = max((ring_centroid(p[0]) for p in polys), key=lambda t: t[2])
    return round(best[0], 3), round(best[1], 3)


# Hand nudges where the largest-polygon centroid reads badly on the map.
LABEL_NUDGE = {"FL": (0.8, -0.6), "LA": (-0.6, 0.0), "MI": (0.6, -0.8)}


def main():
    # ── geometry + names ──────────────────────────────────────────────────
    with open(RAW_GEO) as f:
        geo = json.load(f)
    features, states = [], []
    for ft in geo["features"]:
        code = ft["properties"].get("state")
        if not code:  # Puerto Rico in the source file: not in NAEP state results
            continue
        if code in INSETS:
            ft["geometry"] = inset(ft["geometry"], code)
        lon, lat = label_point(ft["geometry"])
        dx, dy = LABEL_NUDGE.get(code, (0, 0))
        name = ft["properties"]["name"]
        states.append({"code": code, "name": name,
                       "lon": round(lon + dx, 3), "lat": round(lat + dy, 3)})
        features.append({"type": "Feature", "properties": {"code": code, "name": name},
                         "geometry": ft["geometry"]})
    states.sort(key=lambda s: s["code"])

    # ── scores ────────────────────────────────────────────────────────────
    with open(RAW_CSV) as f:
        raw = [r for r in csv.DictReader(f) if r["value"]]

    # One sample per assessment-year for every jurisdiction, so states and
    # the national average in the same year are always comparable: R3 if
    # the states reported an R3 sample that year, otherwise R2. (In 1996
    # math, for example, states reported R2 only, so the nation uses R2 too.)
    has_state_r3 = {(r["assessment"], int(r["year"])) for r in raw
                    if r["sample"] == "R3" and r["jurisdiction"] != "NP"}
    pick = {}  # (assessment, juris, year) -> row
    for r in raw:
        a, y = r["assessment"], int(r["year"])
        want = "R3" if (a, y) in has_state_r3 else "R2"
        if r["sample"] == want:
            pick[(a, r["jurisdiction"], y)] = r

    scores = defaultdict(lambda: defaultdict(list))
    years = defaultdict(set)
    r2_years = defaultdict(set)
    for (a, j, y), r in sorted(pick.items()):
        row = [y, round(float(r["value"]), 2), round(float(r["stdError"]), 2)]
        if r["sample"] == "R2":
            row.append(1)  # 4th element = accommodations not permitted
            r2_years[a].add(y)
        scores[a][j].append(row)
        years[a].add(y)

    assessments = {}
    for a, meta in LABELS.items():
        vals = [p[1] for j, s in scores[a].items() if j != "NP" for p in s]
        assessments[a] = {
            **meta,
            "years": sorted(years[a]),
            "r2_years": sorted(r2_years[a]),
            "domain": [min(vals), max(vals)],
        }

    out = {
        "generated": datetime.date.today().isoformat(),
        "source": "NAEP Data Service, nationsreportcard.gov (NCES). "
                  "Mean scale scores, all students, public schools.",
        "assessments": assessments,
        "states": states,
        "scores": {a: dict(sorted(s.items())) for a, s in scores.items()},
    }

    os.makedirs(FRONT, exist_ok=True)
    with open(os.path.join(FRONT, "naep.json"), "w") as f:
        json.dump(out, f, separators=(",", ":"))
    with open(os.path.join(FRONT, "us-states.json"), "w") as f:
        json.dump({"type": "FeatureCollection", "features": features}, f, separators=(",", ":"))

    n = sum(len(v) for s in scores.values() for v in s.values())
    print(f"naep.json: {n} state-year scores across {len(scores)} assessments")
    for a, m in assessments.items():
        print(f"  {a:10s} {m['years'][0]}–{m['years'][-1]}  ({len(m['years'])} cycles, "
              f"R2-only: {m['r2_years'] or '—'})")


if __name__ == "__main__":
    main()
