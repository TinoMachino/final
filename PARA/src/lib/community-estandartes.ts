/**
 * @deprecated Use `civic-insignias.ts` instead.
 * This file re-exports the unified civic insignia system for backward compatibility.
 */

export {
  getCommunityInsignia as getCommunityEstandarte,
  insigniaFromColor as estandarteFromColor,
  type InsigniaColors as EstandarteColors,
} from '#/lib/civic-insignias'
