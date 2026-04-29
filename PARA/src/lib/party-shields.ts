/**
 * @deprecated Use `civic-insignias.ts` instead.
 * This file re-exports the unified civic insignia system for backward compatibility.
 */

export {
  extractPartyInsignia as extractPartyShield,
  hasPartyPrefix,
  createDisplayRichText,
  type CivicInsigniaInfo as PartyShieldInfo,
} from '#/lib/civic-insignias'
