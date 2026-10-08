import React, { useState, useEffect } from 'react';
import { Tv, Crosshair, ShieldAlert, Sparkles, LogOut, Radio, Wrench } from 'lucide-react';
import { soundEngine } from '../game/audio';

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
    <div className="fixed inset-0 z-30 bg-black/90 backdrop-blur-md text-white flex flex-col justify-between p-8 font-['Plus_Jakarta_Sans'] select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-emerald-500 animate-pulse" />
          <div>
            <h2 className="text-2xl font-bold font-['Chakra_Petch'] text-emerald-400">
              SAFEHOUSE FORTIFIED OUTPOST
            </h2>
            <p className="text-xs text-neutral-400 font-mono">
              SECURE ZONE · REST & WEAPON BENCH · OUTLOOK SNIPER BUREAU
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl">
          <Radio className="w-4 h-4 text-amber-400 animate-spin" />
          <span className="text-xs font-mono text-neutral-300">
            NEXT HORDE INVASION IN: <b className="text-red-500 font-['Chakra_Petch'] text-base ml-1">{restSecondsLeft}s</b>
          </span>
        </div>
      </div>

      {/* Main Grid: TV Broadcast & Gun Bureau Slot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto items-center">
        
        {/* TV CRT Broadcast (6 Cols) */}
        <div className="lg:col-span-6 bg-neutral-950 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold font-['Chakra_Petch'] text-neutral-400 flex items-center gap-2">
              <Tv className="w-4 h-4 text-emerald-500" /> SURVIVOR EMERGENCY BROADCAST CH-0{tvChannel}
            </span>
            <button 
              onClick={() => { setTvChannel((prev) => (prev % 3) + 1); soundEngine.playMechanicalClick(); }}
              className="px-2.5 py-1 bg-neutral-900 border border-neutral-700 hover:border-emerald-500 text-[11px] rounded font-mono"
            >
              SWITCH CHANNEL
            </button>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-neutral-800 aspect-video">
            <img 
              src="/src/assets/images/safehouse_tv_broadcast_1790921673743.jpg" 
              alt="Safehouse TV" 
              className="w-full h-full object-cover filter contrast-125 saturate-150"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 text-xs font-mono text-red-400 bg-black/80 p-2 rounded border border-red-900/50 animate-pulse">
              [EMERGENCY BROADCAST]: Skinwalker horde breaches reported in sector 4. Double tanks sighted near perimeter!
            </div>
          </div>
        </div>

        {/* Safehouse Control Actions (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Telescope Sniper Bureau Button */}
          <button
            onClick={() => { soundEngine.playMechanicalClick(); onEnterTelescopeMode(); }}
            className="w-full p-5 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-red-800 hover:border-red-500 rounded-2xl transition-all group flex items-center justify-between text-left shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-950/60 border border-red-700/60 rounded-xl group-hover:scale-110 transition-transform">
                <Crosshair className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-['Chakra_Petch'] text-white">
                  TELESCOPE WINDOW SNIPER SLOT
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Aim high-powered telescope rifle through fortified window to pick off incoming Striker Zombies before they reach farms.
                </p>
              </div>
            </div>
          </button>

          {/* Weapon Bench Cutscene Button */}
          <button
            onClick={() => { soundEngine.playMechanicalClick(); onTriggerWeaponPrepCutscene(); }}
            className="w-full p-5 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 hover:border-emerald-500 rounded-2xl transition-all group flex items-center justify-between text-left shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-xl group-hover:scale-110 transition-transform">
                <Wrench className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-['Chakra_Petch'] text-white">
                  PREPARE WEAPONS BENCH [CUTSCENE]
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Rack bolts, reload magazines, and view high-definition 3D weapon inspection sequence.
                </p>
              </div>
            </div>
          </button>

          {/* Exit Safehouse */}
          <button
            onClick={() => { soundEngine.playMechanicalClick(); onExitSafehouse(); }}
            className="w-full py-4 bg-red-700 hover:bg-red-800 text-white font-extrabold text-sm tracking-wider rounded-xl font-['Chakra_Petch'] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
          >
            <LogOut className="w-5 h-5" /> STEP OUT OF SAFEHOUSE INTO THE NIGHT
          </button>

        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-neutral-800 pt-3 text-center text-xs text-neutral-500 font-mono">
        SAFEHOUSE STATUS: HEAVY STEEL DOOR LOCKED · REINFORCED BARRIER ACTIVE
      </div>
    </div>
  );
};
