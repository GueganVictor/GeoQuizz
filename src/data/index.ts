// Country catalog module. Exposes the worldwide deck (split per continent), and for
// each country a flag URL (flagUrl) and a region map path (per-continent SHAPES).

import { DECKS_BY_CONTINENT, WORLD } from './countries'
import { contextShapes, regionShapes, type CountryShape } from './geometry'
import { REGION_FRAMES } from './regions'
import { CONTINENTS, type Continent, type Country } from './types'

export type { Continent, Country } from './types'
export type { RegionFrame } from './regions'
export type { CountryShape } from './geometry'
export { CONTINENTS } from './types'
export {
  EUROPE,
  ASIA,
  AFRICA,
  NAMERICA,
  SAMERICA,
  OCEANIA,
  WORLD,
  DECKS_BY_CONTINENT,
  flagUrl,
} from './countries'
export { REGION_FRAMES } from './regions'
export { regionShapes } from './geometry'

/** Decks by continent — every continent populated (DESIGN §9). */
export const DECKS: Record<Continent, Country[]> = DECKS_BY_CONTINENT

/** Country lookup by ISO numeric id, across the whole world. */
export const COUNTRY_BY_ID: Map<number, Country> = new Map(WORLD.map((c) => [c.id, c]))

/** The continent a country belongs to (its color + map frame), or undefined if unknown. */
export function continentOf(countryId: number): Continent | undefined {
  return COUNTRY_BY_ID.get(countryId)?.continent
}

/**
 * Map paths for a deck, projected into its continent's region frame. Returns the
 * "map path for each" half of the catalog (the flag half is `flagUrl`).
 */
export function shapesFor(deck: Country[], continent: Continent): CountryShape[] {
  return regionShapes(
    deck.map((c) => c.id),
    REGION_FRAMES[continent],
  )
}

/** Precomputed region map paths per continent, one entry per deck country. */
export const SHAPES_BY_CONTINENT: Record<Continent, CountryShape[]> = Object.fromEntries(
  CONTINENTS.map((c) => [c, shapesFor(DECKS[c], c)]),
) as Record<Continent, CountryShape[]>

/** Region map paths for one continent (the tappable field for its location cards). */
export function shapesForContinent(continent: Continent): CountryShape[] {
  return SHAPES_BY_CONTINENT[continent]
}

/**
 * Surrounding-world context paths for a continent — every *other* country that falls
 * inside its frame, drawn greyed behind the deck so the region reads in world context.
 * Lazily computed (it projects the whole atlas per frame) and memoized.
 */
const contextCache = new Map<Continent, CountryShape[]>()
export function contextForContinent(continent: Continent): CountryShape[] {
  let shapes = contextCache.get(continent)
  if (!shapes) {
    shapes = contextShapes(
      REGION_FRAMES[continent],
      DECKS[continent].map((c) => c.id),
    )
    contextCache.set(continent, shapes)
  }
  return shapes
}

/** Precomputed Europe map paths (kept for the v1 demo + back-compat). */
export const EUROPE_SHAPES: CountryShape[] = SHAPES_BY_CONTINENT.europe
