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

const featureById = new Map<number, CountryFeature>(
  allFeatures.map((f) => [Number(f.id), f]),
)

/** An SVG `<path>` for one country, projected into a region frame. */
export interface CountryShape {
  id: number
  /** `d` attribute; empty string if the id has no geometry in the atlas. */
  d: string
}

/**
 * Project the given country ids into a region frame and return one SVG path each.
 *
 * A single Mercator projection is fit to the frame's lon/lat box (`fitExtent`), so
 * every shape shares the same projection — this is what makes neighbouring
 * countries hit-testable against each other on the region map (DESIGN §5).
 */
export function regionShapes(ids: number[], frame: RegionFrame): CountryShape[] {
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
  const pathGen = geoPath(projection)

  return ids.map((id) => {
    const f = featureById.get(id)
    return { id, d: f ? pathGen(f) ?? '' : '' }
  })
}
