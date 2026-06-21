// Domain types for the country catalog (Slice 1).

/** The six continent buckets that own the per-continent color system (DESIGN §11). */
export type Continent =
  | 'europe'
  | 'asia'
  | 'africa'
  | 'namerica'
  | 'samerica'
  | 'oceania'

/**
 * One catalog entry. A *card* is a (country × skill) pair (DESIGN §2); this is
 * the country half — the shared content both skills draw from.
 */
export interface Country {
  /** ISO 3166-1 numeric — the key shared with world-atlas TopoJSON geometry. */
  id: number
  /** ISO 3166-1 alpha-2, lowercase — used to build flagcdn URLs (DESIGN §6). */
  iso2: string
  /** English display name. */
  name: string
  /** Continent bucket; also selects the region map frame (see regions.ts). */
  continent: Continent
  /** Natural Earth `pop_est`; only used to population-sort the onboarding triage (DESIGN §3). */
  population: number
}
