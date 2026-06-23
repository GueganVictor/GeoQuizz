/**
 * A subtle, *random* background tint per country, so neighbouring countries on a
 * region map read as separate shapes instead of one grey blob — letting the border
 * width stay thin (a thick border eats small islands whole when zoomed out).
 *
 * The hue is deliberately re-rolled on every render and carries NO information: a
 * player must not be able to learn "the pink one is France" and lean on colour
 * instead of actually knowing the geography. Tints are pale + desaturated so the
 * answer-state fills (selected / correct / wrong) and the dark outline stay dominant.
 */
export function randomTints(ids: Iterable<number>): Map<number, string> {
  const tints = new Map<number, string>()
  for (const id of ids) {
    const hue = Math.floor(Math.random() * 360)
    tints.set(id, `hsl(${hue} 42% 91%)`)
  }
  return tints
}
