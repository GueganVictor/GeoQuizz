import type { Continent } from './types'

/**
 * A region-scoped map frame. Each continent gets its own projected SVG because a
 * single world projection leaves small countries untappable even when zoomed
 * (DESIGN §5). The frame is a lon/lat box the Mercator projection is fit to, plus
 * the target viewBox size.
 *
 * A frame need not contain a country's *entire* geometry — huge countries (Russia,
 * Canada, the USA) clip at the edges and are still easy to tap from the visible
 * bulk. Boxes are chosen to frame the dense cluster of each continent's countries.
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
 * Per-continent projection frames (Slice 9 — all six continents). The Europe box
 * clips outliers (Svalbard, the Canaries) so the projection frames mainland Europe
 * plus Cyprus; the others frame their continent's main landmass.
 */
export const REGION_FRAMES: Record<Continent, RegionFrame> = {
  europe: {
    width: 360,
    height: 460,
    bounds: [
      [-11, 34],
      [36, 71.5],
    ],
  },
  asia: {
    width: 460,
    height: 380,
    bounds: [
      [26, -11],
      [146, 56],
    ],
  },
  africa: {
    width: 360,
    height: 420,
    bounds: [
      [-18, -35],
      [52, 38],
    ],
  },
  namerica: {
    width: 380,
    height: 420,
    bounds: [
      [-125, 7],
      [-52, 62],
    ],
  },
  samerica: {
    width: 320,
    height: 460,
    bounds: [
      [-82, -56],
      [-34, 13],
    ],
  },
  oceania: {
    width: 460,
    height: 380,
    bounds: [
      [110, -48],
      [184, 0],
    ],
  },
}
