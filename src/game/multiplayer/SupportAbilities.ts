import { HumanCharacterId } from '../characterMesh';

export type SupportAbility = 'heal' | 'mark_safehouse' | 'revive';

export const SUPPORT_ABILITIES: Record<HumanCharacterId, SupportAbility[]> = {
  titan: [],
  katrina: ['heal', 'mark_safehouse', 'revive'],
  natasha: [], // Inherits after story event
  bill: [],
  luis: [],
  lewis: []
};

export const getAbilitiesForCharacter = (charId: HumanCharacterId, isSuccessionComplete: boolean): SupportAbility[] => {
  if (isSuccessionComplete && charId === 'natasha') {
    return ['heal', 'mark_safehouse', 'revive'];
  }
  return SUPPORT_ABILITIES[charId] || [];
};
