"""
Fetch state-level NAEP mean scale scores + standard errors from the
NAEP Data Service (nationsreportcard.gov) and write etl/raw/naep_raw.csv.

One request per assessment x year-sample, all jurisdictions at once.
Rows the service marks as not displayable (the state did not participate,
or reporting standards were not met) are kept with empty value/stdError so
the raw file is a complete record of what was asked for.

Usage:
  python fetch_naep.py                 # fetch everything, overwrite raw csv
  python fetch_naep.py --add-year 2026 # also request a new cycle (R3)

Then run build_atlas.py to regenerate frontend/src/data/naep.json.

Standard library only.
"""

import argparse
import csv
import json
import os
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "raw", "naep_raw.csv")

API = "https://www.nationsreportcard.gov/DataService/GetAdhocData.aspx"

JURISDICTIONS = (
    "NP,AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,"
    "MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,"
    "WA,WV,WI,WY"
)

# Main-NAEP state assessment cycles. R2 = accommodations not permitted
# (the only sample before 1996); R3 = accommodations permitted (the
# reporting sample from 1996/1998 on). Both are requested where both exist.
MODERN = [2003, 2005, 2007, 2009, 2011, 2013, 2015, 2017, 2019, 2022, 2024]

ASSESSMENTS = {
    "math-4": dict(subject="mathematics", grade=4, subscale="MRPCM",
                   years=["1992R2", "1996R2", "1996R3", "2000R2", "2000R3"]),
    "math-8": dict(subject="mathematics", grade=8, subscale="MRPCM",
                   years=["1990R2", "1992R2", "1996R2", "1996R3", "2000R2", "2000R3"]),
    "reading-4": dict(subject="reading", grade=4, subscale="RRPCM",
                      years=["1992R2", "1994R2", "1998R2", "1998R3", "2002R3"]),
    "reading-8": dict(subject="reading", grade=8, subscale="RRPCM",
                      years=["1998R2", "1998R3", "2002R3"]),
}
for a in ASSESSMENTS.values():
    a["years"] += [f"{y}R3" for y in MODERN]


def fetch(spec, year_sample, retries=3):
    params = {
        "type": "data",
        "subject": spec["subject"],
        "grade": spec["grade"],
        "subscale": spec["subscale"],
        "variable": "TOTAL",
        "jurisdiction": JURISDICTIONS,
        "stattype": "MN:MN",
        "Year": year_sample,
        "ShowDetails": "true",
    }
    url = API + "?" + urllib.parse.urlencode(params, safe=",:")
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "naep-atlas-etl"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)["result"]
        except Exception as e:  # noqa: BLE001
            if attempt == retries - 1:
                raise RuntimeError(f"{year_sample}: {e}") from e
            time.sleep(2 * (attempt + 1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--add-year", type=int, action="append", default=[],
                    help="request an additional R3 cycle, e.g. 2026")
    args = ap.parse_args()
    for y in args.add_year:
        for a in ASSESSMENTS.values():
            a["years"].append(f"{y}R3")

    rows, failures = [], []
    for key, spec in ASSESSMENTS.items():
        for ys in spec["years"]:
            try:
                result = fetch(spec, ys)
            except RuntimeError as e:
                failures.append(f"{key} {e}")
                print(f"  ! {key} {ys}: failed", file=sys.stderr)
                continue
            for x in result:
                ok = bool(x.get("isStatDisplayable"))
                rows.append([
                    key, x["jurisdiction"], x["year"], x["sample"],
                    round(x["value"], 3) if ok else "",
                    round(x["stdError"], 3) if ok else "",
                    x.get("errorFlag", ""),
                ])
            print(f"  {key} {ys}: {sum(1 for r in result if r.get('isStatDisplayable'))} displayable")

    if failures:
        print("\nSome requests failed; raw file NOT overwritten:", *failures, sep="\n  ")
        sys.exit(1)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["assessment", "jurisdiction", "year", "sample",
                    "value", "stdError", "errorFlag"])
        w.writerows(rows)
    print(f"\nwrote {len(rows)} rows -> {os.path.relpath(OUT)}")


if __name__ == "__main__":
    main()
