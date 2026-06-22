import type { Continent } from './types'

/**
 * A region-scoped map frame. Each continent gets its own projected SVG because a
 * single world projection leaves small countries untappable even when zoomed
 * (DESIGN §5). The frame is a lon/lat box the Mercator projection is fit to, plus
 * the target viewBox size.
 */
export interface RegionFrame {
  /** viewBox width in user units. */
  width: number
  /** viewBox height in user units. */
  height: number
  /** lon/lat bounding box `[[west, south], [east, north]]` fed to `fitExtent`. */
  bounds: [[number, number], [number, number]]
}

/**
 * Per-continent projection frames. Europe is the v1 validation slice; the other
 * continents are filled in at Slice 9 when content scales worldwide.
 *
 * The Europe box clips outliers (Svalbard, the Canaries) so the projection frames
 * mainland Europe — proven in the location map game.
 */
export const REGION_FRAMES: Partial<Record<Continent, RegionFrame>> = {
  europe: {
    width: 360,
    height: 470,
    bounds: [
      [-11, 34],
      [32, 71.5],
    ],
  },
}
