import type { Country } from './types'

/**
 * The Europe deck — the v1 validation region (DESIGN §9). One entry per country
 * whose geometry is present in the world-atlas `countries-50m` set, keyed by ISO
 * numeric id. Ordered population-descending for readability; consumers sort as
 * they need (the onboarding triage is the only population-sorted view, DESIGN §3).
 *
 * Populations are Natural Earth `pop_est`-scale estimates — precise enough to rank
 * the triage, not authoritative demographics.
 */
export const EUROPE: Country[] = [
  { id: 276, iso2: 'de', name: 'Germany', continent: 'europe', population: 83_200_000 },
  { id: 250, iso2: 'fr', name: 'France', continent: 'europe', population: 67_800_000 },
  { id: 826, iso2: 'gb', name: 'United Kingdom', continent: 'europe', population: 67_200_000 },
  { id: 380, iso2: 'it', name: 'Italy', continent: 'europe', population: 59_000_000 },
  { id: 724, iso2: 'es', name: 'Spain', continent: 'europe', population: 47_400_000 },
  { id: 804, iso2: 'ua', name: 'Ukraine', continent: 'europe', population: 43_700_000 },
  { id: 616, iso2: 'pl', name: 'Poland', continent: 'europe', population: 37_900_000 },
  { id: 642, iso2: 'ro', name: 'Romania', continent: 'europe', population: 19_200_000 },
  { id: 528, iso2: 'nl', name: 'Netherlands', continent: 'europe', population: 17_500_000 },
  { id: 56, iso2: 'be', name: 'Belgium', continent: 'europe', population: 11_600_000 },
  { id: 203, iso2: 'cz', name: 'Czechia', continent: 'europe', population: 10_700_000 },
  { id: 300, iso2: 'gr', name: 'Greece', continent: 'europe', population: 10_400_000 },
  { id: 752, iso2: 'se', name: 'Sweden', continent: 'europe', population: 10_400_000 },
  { id: 620, iso2: 'pt', name: 'Portugal', continent: 'europe', population: 10_300_000 },
  { id: 348, iso2: 'hu', name: 'Hungary', continent: 'europe', population: 9_700_000 },
  { id: 112, iso2: 'by', name: 'Belarus', continent: 'europe', population: 9_400_000 },
  { id: 40, iso2: 'at', name: 'Austria', continent: 'europe', population: 9_000_000 },
  { id: 756, iso2: 'ch', name: 'Switzerland', continent: 'europe', population: 8_700_000 },
  { id: 100, iso2: 'bg', name: 'Bulgaria', continent: 'europe', population: 6_900_000 },
  { id: 688, iso2: 'rs', name: 'Serbia', continent: 'europe', population: 6_900_000 },
  { id: 208, iso2: 'dk', name: 'Denmark', continent: 'europe', population: 5_800_000 },
  { id: 246, iso2: 'fi', name: 'Finland', continent: 'europe', population: 5_500_000 },
  { id: 703, iso2: 'sk', name: 'Slovakia', continent: 'europe', population: 5_500_000 },
  { id: 578, iso2: 'no', name: 'Norway', continent: 'europe', population: 5_400_000 },
  { id: 372, iso2: 'ie', name: 'Ireland', continent: 'europe', population: 5_000_000 },
  { id: 191, iso2: 'hr', name: 'Croatia', continent: 'europe', population: 4_000_000 },
  { id: 70, iso2: 'ba', name: 'Bosnia and Herzegovina', continent: 'europe', population: 3_300_000 },
  { id: 8, iso2: 'al', name: 'Albania', continent: 'europe', population: 2_900_000 },
  { id: 440, iso2: 'lt', name: 'Lithuania', continent: 'europe', population: 2_800_000 },
  { id: 498, iso2: 'md', name: 'Moldova', continent: 'europe', population: 2_600_000 },
  { id: 807, iso2: 'mk', name: 'North Macedonia', continent: 'europe', population: 2_100_000 },
  { id: 705, iso2: 'si', name: 'Slovenia', continent: 'europe', population: 2_100_000 },
  { id: 428, iso2: 'lv', name: 'Latvia', continent: 'europe', population: 1_900_000 },
  { id: 233, iso2: 'ee', name: 'Estonia', continent: 'europe', population: 1_300_000 },
  { id: 442, iso2: 'lu', name: 'Luxembourg', continent: 'europe', population: 630_000 },
  { id: 499, iso2: 'me', name: 'Montenegro', continent: 'europe', population: 620_000 },
  { id: 352, iso2: 'is', name: 'Iceland', continent: 'europe', population: 360_000 },
]

/** flagcdn flag image URL by ISO2 code (DESIGN §6). Widths: w160 / w320 / w640 … */
export function flagUrl(iso2: string, size = 'w320'): string {
  return `https://flagcdn.com/${size}/${iso2}.png`
}
