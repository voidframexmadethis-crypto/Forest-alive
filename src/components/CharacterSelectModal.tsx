import React, { useState } from 'react';
import { HumanCharacterId } from '../game/characterMesh';
import { Shield, User, Zap, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

interface CharacterSelectModalProps {
  selectedCharacter: HumanCharacterId;
  onSelectCharacter: (id: HumanCharacterId) => void;
  onClose: () => void;
}

export const CHARACTERS_INFO: Record<HumanCharacterId, {
  id: HumanCharacterId;
  name: string;
  role: string;
  description: string;
  outfit: string;
  perk: string;
  stats: { health: number; speed: number; stamina: number };
}> = {
  titan: {
    id: 'titan',
    name: 'TITAN (Main Protagonist)',
    role: 'Lead Tactical Operative',
    description: 'Veteran survival operative and central protagonist of Forest Alive. Specialist in heavy kinetic weaponry and tactical combat positioning.',
    outfit: 'Tactical Combat Vest & Dark Camouflage Pants',
    perk: 'Tactical Recoil Control & Heavy Weapon Mastery',
    stats: { health: 100, speed: 6.0, stamina: 100 }
  },
  katrina: {
    id: 'katrina',
    name: 'KATRINA',
    role: 'Survival Recon Specialist',
    description: 'Agile field scout equipped for rapid relocation and stealth tracking. Recognizable by her iconic red sweater, white shirt, and dark trousers.',
    outfit: 'Red Knit Sweater, White Collar & Dark Trousers',
    perk: 'Agile Sprinting & Fast Stamina Recovery',
    stats: { health: 90, speed: 6.5, stamina: 120 }
  },
  lewis: {
    id: 'lewis',
    name: 'LEWIS',
    role: 'Combat Engineer & Mechanic',
    description: 'Hardened field mechanic capable of maintaining safehouse defenses, vehicles, and heavy artillery under high-stress horde pressure.',
    outfit: 'Canvas Flannel Jacket & Heavy Work Jeans',
    perk: 'Defensive Fortification & Fast Reload Speed',
    stats: { health: 110, speed: 5.8, stamina: 95 }
  },
  bill: {
    id: 'bill',
    name: 'BILL',
    role: 'Veteran Marksman',
    description: 'Experienced wilderness survivor with decades of long-range engagement expertise. Highly accurate under low-light forest conditions.',
    outfit: 'Olive Field Jacket, Cap & Cargo Trousers',
    perk: 'Precision Headshot Multiplier & Flashlight Range',
    stats: { health: 100, speed: 5.8, stamina: 100 }
  }
};

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  selectedCharacter,
  onSelectCharacter,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<HumanCharacterId>(selectedCharacter);

  const activeChar = CHARACTERS_INFO[activeTab];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans'] select-none">
      <div className="bg-neutral-950 border border-red-600/40 rounded-2xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.25)] flex flex-col md:flex-row">
        
        {/* LEFT SELECTION PANEL */}
        <div className="w-full md:w-1/3 bg-neutral-900/60 border-b md:border-b-0 md:border-r border-neutral-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-red-500 animate-pulse" />
              <h2 className="text-xl font-extrabold font-['Chakra_Petch'] text-white tracking-wider">
                MULTIPLAYER AVATAR
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mb-6">
              Choose your survivor avatar for online multiplayer co-op matches.
            </p>

            <div className="flex flex-col gap-2.5">
              {(Object.keys(CHARACTERS_INFO) as HumanCharacterId[]).map((cId) => {
                const info = CHARACTERS_INFO[cId];
                const isSelected = activeTab === cId;
                return (
                  <button
                    key={cId}
                    onClick={() => setActiveTab(cId)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-red-950/80 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold font-['Chakra_Petch'] text-sm flex items-center gap-2">
                        {info.name.split(' ')[0]}
                        {cId === 'titan' && <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-mono">LEAD</span>}
                      </div>
                      <div className="text-[10px] text-neutral-400">{info.role}</div>
                    </div>
                    {isSelected ? <CheckCircle2 className="w-4 h-4 text-red-400" /> : <ChevronRight className="w-4 h-4 text-neutral-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 text-[10px] text-neutral-500 font-mono border-t border-neutral-800/80 pt-4">
            Note: Single-Player campaign is strictly Titan's story.
          </div>
        </div>

        {/* RIGHT CHARACTER INSPECTION PANEL */}
        <div className="w-full md:w-2/3 p-8 flex flex-col justify-between bg-gradient-to-br from-neutral-950 via-neutral-900 to-black">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold text-red-500 tracking-widest font-mono uppercase bg-red-950/80 border border-red-600/40 px-2.5 py-1 rounded-md">
                  {activeChar.role}
                </span>
                <h1 className="text-3xl font-extrabold font-['Chakra_Petch'] text-white tracking-widest mt-2">
                  {activeChar.name}
                </h1>
              </div>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed mb-6 font-sans">
              {activeChar.description}
            </p>

            {/* CHARACTER DETAILS */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-neutral-900/80 border border-neutral-800 p-3.5 rounded-xl">
                <span className="text-[10px] font-mono text-neutral-400 block mb-1">SIGNATURE OUTFIT</span>
                <span className="text-xs font-bold text-white font-['Chakra_Petch']">{activeChar.outfit}</span>
              </div>
              <div className="bg-neutral-900/80 border border-neutral-800 p-3.5 rounded-xl">
                <span className="text-[10px] font-mono text-neutral-400 block mb-1">SPECIAL SURVIVAL PERK</span>
                <span className="text-xs font-bold text-amber-400 font-['Chakra_Petch'] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {activeChar.perk}
                </span>
              </div>
            </div>

            {/* STAT BARS */}
            <div className="space-y-3 bg-black/40 border border-neutral-800/80 p-4 rounded-xl">
              <div>
                <div className="flex justify-between text-xs font-bold font-['Chakra_Petch'] mb-1">
                  <span className="text-neutral-400 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-red-500" /> MAX VITAL HEALTH</span>
                  <span className="text-white">{activeChar.stats.health} HP</span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full" style={{ width: `${(activeChar.stats.health / 120) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold font-['Chakra_Petch'] mb-1">
                  <span className="text-neutral-400 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" /> STAMINA & SPEED</span>
                  <span className="text-white">{activeChar.stats.stamina} STAMINA</span>
                </div>
                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${(activeChar.stats.stamina / 120) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-8">
            <button
              onClick={onClose}
              className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-xl text-xs font-bold font-['Chakra_Petch'] tracking-wider cursor-pointer transition-all"
            >
              CANCEL
            </button>
            <button
              onClick={() => {
                onSelectCharacter(activeTab);
                onClose();
              }}
              className="px-8 py-3 bg-red-700 hover:bg-red-600 border border-red-500 text-white rounded-xl text-xs font-extrabold font-['Chakra_Petch'] tracking-widest cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all flex items-center gap-2"
            >
              CONFIRM SELECTION <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
