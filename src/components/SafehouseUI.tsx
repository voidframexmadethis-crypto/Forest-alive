import React, { useState, useEffect } from 'react';
import { Tv, Crosshair, ShieldAlert, Sparkles, LogOut, Radio, Wrench, Heart } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { KatrinaSafehouse } from './KatrinaSafehouse';

interface SafehouseUIProps {
  onExitSafehouse: () => void;
  onTriggerWeaponPrepCutscene: () => void;
  onEnterTelescopeMode: () => void;
}

export const SafehouseUI: React.FC<SafehouseUIProps> = ({
  onExitSafehouse,
  onTriggerWeaponPrepCutscene,
  onEnterTelescopeMode
}) => {
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(45);
  const [tvChannel, setTvChannel] = useState<number>(1);
  const [showKatrina, setShowKatrina] = useState<boolean>(false);
  const [isPostLabor, setIsPostLabor] = useState<boolean>(false); // This would be managed by global game state/story flags

  useEffect(() => {
    const timer = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md text-white flex flex-col justify-between p-6 xs:p-8 font-['Plus_Jakarta_Sans'] select-none overflow-y-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 xs:w-8 xs:h-8 text-emerald-500 animate-pulse" />
          <div>
            <h2 className="text-xl xs:text-2xl font-bold font-['Chakra_Petch'] text-emerald-400">
              SAFEHOUSE OUTPOST
            </h2>
            <p className="text-[9px] xs:text-xs text-neutral-400 font-mono uppercase">
              Secure Zone · Weapons · Outlook
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="text-[10px] font-mono text-neutral-300">
            NEXT HORDE: <b className="text-red-500 font-['Chakra_Petch'] text-sm ml-1">{restSecondsLeft}s</b>
          </span>
        </div>
      </div>

      {/* Main Grid: TV Broadcast & Gun Bureau Slot */}
      <div className="grid grid-cols-1 gap-6 my-6">
        
        {/* TV CRT Broadcast */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold font-['Chakra_Petch'] text-neutral-400 flex items-center gap-2">
              <Tv className="w-3.5 h-3.5 text-emerald-500" /> BROADCAST CH-0{tvChannel}
            </span>
            <button 
              onClick={() => { setTvChannel((prev) => (prev % 3) + 1); soundEngine.playMechanicalClick(); }}
              className="px-2 py-0.5 bg-neutral-900 border border-neutral-700 hover:border-emerald-500 text-[9px] rounded font-mono"
            >
              SWITCH
            </button>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-neutral-800 aspect-video max-h-48 mx-auto">
            <img 
              src="/src/assets/images/safehouse_tv_broadcast_1790921673743.jpg" 
              alt="Safehouse TV" 
              className="w-full h-full object-cover filter contrast-125 saturate-150"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 pointer-events-none" />
            <div className="absolute bottom-2 left-2 right-2 text-[9px] font-mono text-red-400 bg-black/80 p-1.5 rounded border border-red-900/50 animate-pulse">
              [STATIC]: Skinwalker breaches detected...
            </div>
          </div>
        </div>

        {/* Safehouse Control Actions */}
        <div className="space-y-3">
          
          {/* Telescope Sniper Bureau Button */}
          <button
            onClick={() => { soundEngine.playMechanicalClick(); onEnterTelescopeMode(); }}
            className="w-full p-4 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-red-800 hover:border-red-500 rounded-xl transition-all group flex items-center gap-4 text-left shadow-lg"
          >
            <div className="p-2.5 bg-red-950/60 border border-red-700/60 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <Crosshair className="w-5 h-5 xs:w-6 xs:h-6 text-red-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm xs:text-base font-bold font-['Chakra_Petch'] text-white truncate">
                WINDOW SNIPER SLOT
              </h3>
              <p className="text-[10px] text-neutral-500 truncate">
                Pick off incoming zombies.
              </p>
            </div>
          </button>

          {/* Weapon Bench Cutscene Button */}
          <button
            onClick={() => { soundEngine.playMechanicalClick(); onTriggerWeaponPrepCutscene(); }}
            className="w-full p-4 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 hover:border-emerald-500 rounded-xl transition-all group flex items-center gap-4 text-left shadow-lg"
          >
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-700/60 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <Wrench className="w-5 h-5 xs:w-6 xs:h-6 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm xs:text-base font-bold font-['Chakra_Petch'] text-white truncate">
                WEAPONS BENCH
              </h3>
              <p className="text-[10px] text-neutral-500 truncate">
                Inspect tactical gear.
              </p>
            </div>
          </button>

          {/* Interaction with Katrina */}
          <button
            onClick={() => { soundEngine.playMechanicalClick(); setShowKatrina(true); }}
            className="w-full p-4 bg-gradient-to-r from-emerald-950/80 via-emerald-900/50 to-neutral-950/90 border border-emerald-800 hover:border-emerald-500 rounded-xl transition-all group flex items-center gap-4 text-left shadow-lg"
          >
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-700/60 rounded-lg group-hover:scale-110 transition-transform shrink-0">
              <Heart className="w-5 h-5 xs:w-6 xs:h-6 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm xs:text-base font-bold font-['Chakra_Petch'] text-white truncate">
                VISIT KATRINA
              </h3>
              <p className="text-[10px] text-neutral-500 truncate">
                Check on her & the baby.
              </p>
            </div>
          </button>

          {/* Exit Safehouse */}
          <button
            onClick={() => { soundEngine.playMechanicalClick(); onExitSafehouse(); }}
            className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs tracking-wider rounded-xl font-['Chakra_Petch'] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
          >
            <LogOut className="w-4 h-4" /> STEP INTO THE NIGHT
          </button>

          {showKatrina && (
            <KatrinaSafehouse 
              isPostLabor={isPostLabor} 
              onClose={() => setShowKatrina(false)} 
            />
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-800 pt-3 text-center text-[9px] text-neutral-600 font-mono">
        SAFEHOUSE STATUS: REINFORCED BARRIER ACTIVE
      </div>
    </div>
  );
};
