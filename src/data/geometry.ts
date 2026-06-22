import { geoMercator, geoPath } from 'd3-geo'
import type { Feature, Geometry } from 'geojson'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import world from 'world-atlas/countries-50m.json'

import type { RegionFrame } from './regions'

const topo = world as unknown as Topology

type CountryFeature = Feature<Geometry, { name: string }>

// Decode the TopoJSON once and index every country feature by ISO numeric id.
const allFeatures = (
  feature(topo, topo.objects.countries as GeometryCollection) as unknown as {
    features: CountryFeature[]
  }
).features

// Index by ISO numeric id. A few ids collide in the atlas (e.g. 36 = Australia and
// the tiny Ashmore & Cartier Is.); first-wins keeps the sovereign landmass, which
// the atlas lists first.
const featureById = new Map<number, CountryFeature>()
for (const f of allFeatures) {
  const id = Number(f.id)
  if (!featureById.has(id)) featureById.set(id, f)
}

/** An SVG `<path>` for one country, projected into a region frame. */
export interface CountryShape {
  id: number
  /** `d` attribute; empty string if the id has no geometry in the atlas. */
  d: string
}

/** Build the path generator for a frame: one Mercator fit to the frame's lon/lat box. */
function pathGenFor(frame: RegionFrame) {
  const [[west, south], [east, north]] = frame.bounds
  const box: Feature<Geometry> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [west, south],
          [west, north],
          [east, north],
          [east, south],
          [west, south],
        ],
      ],
    },
  }

  const projection = geoMercator().fitExtent(
    [
      [10, 10],
      [frame.width - 10, frame.height - 10],
    ],
    box,
  )
  return geoPath(projection)
}

/**
 * Project the given country ids into a region frame and return one SVG path each.
 *
 * A single Mercator projection is fit to the frame's lon/lat box (`fitExtent`), so
 * every shape shares the same projection — this is what makes neighbouring
 * countries hit-testable against each other on the region map (DESIGN §5).
 */
export function regionShapes(ids: number[], frame: RegionFrame): CountryShape[] {
  const pathGen = pathGenFor(frame)
  return ids.map((id) => {
    const f = featureById.get(id)
    return { id, d: f ? pathGen(f) ?? '' : '' }
  })
}

/**
 * Every *other* atlas country that falls inside a region frame — the surrounding
 * world drawn as non-interactive context behind the region's own deck. Uses the
 * same projection as `regionShapes`, excludes the deck ids (drawn separately), and
 * culls features whose projected bounds fall entirely outside the viewBox.
 */
export function contextShapes(frame: RegionFrame, excludeIds: Iterable<number>): CountryShape[] {
  const exclude = new Set<number>([...excludeIds])
  const pathGen = pathGenFor(frame)
  const out: CountryShape[] = []
  for (const f of allFeatures) {
    const id = Number(f.id)
    if (exclude.has(id)) continue
    const d = pathGen(f)
    if (!d) continue
    const [[x0, y0], [x1, y1]] = pathGen.bounds(f)
    // Skip anything fully off-frame (overflow clips the rest at the edges).
    if (x1 < 0 || y1 < 0 || x0 > frame.width || y0 > frame.height) continue
    out.push({ id, d })
  }
  return out
}
