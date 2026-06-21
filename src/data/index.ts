// Country catalog module (Slice 1). Exposes the Europe deck plus, for each
// country, a flag URL (flagUrl) and a map path (EUROPE_SHAPES / shapesFor).

import { EUROPE } from './countries'
import { regionShapes, type CountryShape } from './geometry'
import { REGION_FRAMES } from './regions'
import type { Continent, Country } from './types'

export type { Continent, Country } from './types'
export type { RegionFrame } from './regions'
export type { CountryShape } from './geometry'
export { EUROPE, flagUrl } from './countries'
export { REGION_FRAMES } from './regions'
export { regionShapes } from './geometry'

/** Decks by continent. Only Europe is populated in v1 (DESIGN §9). */
export const DECKS: Partial<Record<Continent, Country[]>> = {
  europe: EUROPE,
}

/**
 * Map paths for a deck, projected into its continent's region frame. Returns the
 * "map path for each" half of the catalog (the flag half is `flagUrl`).
 */
export function shapesFor(deck: Country[], continent: Continent): CountryShape[] {
  const frame = REGION_FRAMES[continent]
  if (!frame) throw new Error(`No region frame for continent: ${continent}`)
  return regionShapes(
    deck.map((c) => c.id),
    frame,
  )
}

/** Precomputed Europe map paths, one per deck country. */
export const EUROPE_SHAPES: CountryShape[] = shapesFor(EUROPE, 'europe')
