import React, { useEffect, useState } from 'react';
import { ShieldAlert, Crosshair, Play, Plane, Flame } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface CutsceneProps {
  type: 'weapon_prep' | 'tank_escape';
  onComplete: () => void;
}

export const CutsceneModal: React.FC<CutsceneProps> = ({ type, onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [holdTimer, setHoldTimer] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);

  // 1. Cutscene sequence progression timers
  useEffect(() => {
    soundEngine.playMechanicalClick(0.8, 800);

    const timer1 = setTimeout(() => {
      setStep(2);
      soundEngine.playReloadSound();
    }, 2500);

    const timer2 = setTimeout(() => {
      setStep(3);
      if (type === 'tank_escape') {
        soundEngine.playTankEngineRumble();
      } else {
        soundEngine.playFootstep(true, 'metal');
      }
    }, 5500);

    const timer3 = setTimeout(() => {
      onComplete();
    }, 8500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [type, onComplete]);

  // 2. Space / Escape keyboard hold listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Escape') {
        e.preventDefault();
        setIsHolding(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Escape') {
        setIsHolding(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 3. High-performance RequestAnimationFrame Ticker for the progressive skip circle
  useEffect(() => {
    let animationFrameId: number;
    const requiredHoldTime = 1200; // 1.2 seconds in ms for snappy arcade skip feel
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      if (isHolding) {
        setHoldTimer((prev) => {
          const next = Math.min(requiredHoldTime, prev + delta);
          if (next >= requiredHoldTime) {
            soundEngine.playMechanicalClick(0.7, 1800);
            onComplete();
            return 0;
          }
          return next;
        });
      } else {
        // Drain progressive meter twice as fast when keys are released
        setHoldTimer((prev) => Math.max(0, prev - delta * 2.2));
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHolding, onComplete]);

  // Circular SVG coordinates
  const progressPct = holdTimer / 1200;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressPct * circumference;

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-between p-10 select-none font-['Plus_Jakarta_Sans']">
      
      {/* Top Banner */}
      <div className="w-full flex justify-between items-center border-b border-red-900/40 pb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-red-500 animate-pulse" />
          <span className="text-sm font-bold font-['Chakra_Petch'] text-red-500 tracking-wider">
            {type === 'weapon_prep' ? 'TACTICAL WEAPON PREPARATION SEQUENCE' : 'TANK / PLANE EXTRACTION ESCAPE'}
          </span>
        </div>

        {/* Hold-to-Skip AAA Progress widget */}
        <div className="flex items-center gap-3 bg-neutral-950/90 border border-neutral-800 p-2.5 rounded-xl shadow-lg transition-all">
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r={radius}
                stroke="#1f1f1f"
                strokeWidth="3.5"
                fill="transparent"
              />
              <circle
                cx="20"
                cy="20"
                r={radius}
                stroke="#ef4444"
                strokeWidth="3.5"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-75 ease-out"
              />
            </svg>
            <span className="absolute text-[9px] font-bold text-red-500 font-mono">
              {Math.round(progressPct * 100)}%
            </span>
          </div>

          <div className="text-left">
            <div className="text-[9px] font-bold font-['Chakra_Petch'] text-neutral-400">HOLD [SPACE] OR [ESC]</div>
            <div className="text-[10px] font-extrabold font-['Chakra_Petch'] text-white tracking-wide">TO SKIP CINEMATIC</div>
          </div>
        </div>
      </div>

      {/* Cinematic Central Display */}
      <div className="my-auto max-w-4xl text-center space-y-6">
        {type === 'weapon_prep' ? (
          <>
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="w-20 h-20 bg-neutral-900 border border-neutral-700 rounded-2xl mx-auto flex items-center justify-center text-red-500 shadow-xl">
                  <Crosshair className="w-10 h-10 animate-spin" />
                </div>
                <h2 className="text-3xl font-extrabold font-['Chakra_Petch'] text-white">
                  INSPECTING TACTICAL LOADOUT
                </h2>
                <p className="text-sm text-neutral-400 font-mono">
                  Checking barrel geometry, optical red-dot alignment, and chambering 5.56mm NATO rounds...
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="w-20 h-20 bg-neutral-900 border border-neutral-700 rounded-2xl mx-auto flex items-center justify-center text-amber-500 shadow-xl">
                  <ShieldAlert className="w-10 h-10 animate-bounce" />
                </div>
                <h2 className="text-3xl font-extrabold font-['Chakra_Petch'] text-amber-400">
                  RACKING BOLT & CHECKING MAGS
                </h2>
                <p className="text-sm text-neutral-400 font-mono">
                  Extended magazines seated. Flashlight battery verified at 100% output.
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="w-20 h-20 bg-red-950 border border-red-600 rounded-2xl mx-auto flex items-center justify-center text-red-500 shadow-[0_0_25px_rgba(220,38,38,0.5)]">
                  <Play className="w-10 h-10 fill-red-500" />
                </div>
                <h2 className="text-3xl font-extrabold font-['Chakra_Petch'] text-red-500">
                  UNLOCKING HEAVY STEEL SAFEHOUSE DOOR
                </h2>
                <p className="text-sm text-neutral-400 font-mono">
                  Stepping out into the dark fog. Prepare to face the hordes!
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="w-20 h-20 bg-neutral-900 border border-neutral-700 rounded-2xl mx-auto flex items-center justify-center text-red-500 shadow-xl">
                  <Plane className="w-10 h-10 animate-pulse" />
                </div>
                <h2 className="text-3xl font-extrabold font-['Chakra_Petch'] text-white">
                  BOARDING HEAVY ARMORED MILITARY TANK
                </h2>
                <p className="text-sm text-neutral-400 font-mono">
                  Sealing heavy hatch doors as Double Tanks and Skinwalkers pound against the armor!
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="w-20 h-20 bg-neutral-900 border border-neutral-700 rounded-2xl mx-auto flex items-center justify-center text-emerald-500 shadow-xl">
                  <Flame className="w-10 h-10 animate-bounce" />
                </div>
                <h2 className="text-3xl font-extrabold font-['Chakra_Petch'] text-emerald-400">
                  DIESEL TURBO ENGINE RUMBLING TO LIFE
                </h2>
                <p className="text-sm text-neutral-400 font-mono">
                  Tank treads crushing undead hordes beneath as cannon fires continuous suppressive shells!
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="w-20 h-20 bg-emerald-950 border border-emerald-500 rounded-2xl mx-auto flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                  <Plane className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-extrabold font-['Chakra_Petch'] text-emerald-400">
                  REACHED AIRFIELD EXTRACTION PLANE
                </h2>
                <p className="text-sm text-neutral-400 font-mono">
                  Flying to safety above the infested forest canopy! VICTORY ACHIEVED!
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="w-full text-center text-xs text-neutral-500 font-mono border-t border-neutral-900 pt-3">
        DARK FORCE ALIVE CINEMATIC ENGINE
      </div>
    </div>
  );
};
