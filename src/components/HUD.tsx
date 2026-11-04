import React from 'react';
import { PlayerStats, Weapon } from '../types/game';
import { Shield, Zap, Crosshair, Radio, Flashlight, Target, MoveUp, MoveDown, MoveLeft, MoveRight, RotateCw, Sliders, Heart, Cpu } from 'lucide-react';

interface HUDProps {
  stats: PlayerStats;
  weapon: Weapon;
  gameEvent: string;
  isAiming: boolean;
  isReloading: boolean;
  isLocked: boolean;
  onReload: () => void;
  onShoot: () => void;
  onSwitchWeaponSlot?: (idx: number) => void;
  onMoveForward: (val: boolean) => void;
  onMoveBackward: (val: boolean) => void;
  onMoveLeft: (val: boolean) => void;
  onMoveRight: (val: boolean) => void;
  onUnlockPointer: () => void;
  onOpenSandbox?: () => void;
  onOpenModManager?: () => void;
  isMultiplayer?: boolean;
  downedTeammateName?: string | null;
  onRevive?: () => void;
  onLeaveMultiplayer?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  weapon,
  gameEvent,
  isAiming,
  isReloading,
  isLocked,
  onReload,
  onShoot,
  onSwitchWeaponSlot,
  onMoveForward,
  onMoveBackward,
  onMoveLeft,
  onMoveRight,
  onUnlockPointer,
  onOpenSandbox,
  onOpenModManager,
  isMultiplayer,
  downedTeammateName,
  onRevive,
  onLeaveMultiplayer
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 select-none font-['Plus_Jakarta_Sans']">
      
      {/* WINGED FROST SKINWALKER ICE FROZEN OVERLAY (Visual Frost Frame) */}
      {stats.iceFrozenTimer !== undefined && stats.iceFrozenTimer > 0 && (
        <div className="absolute inset-0 z-40 bg-cyan-950/30 border-[18px] border-cyan-400/70 backdrop-blur-[2px] pointer-events-none animate-pulse" />
      )}

      {/* SUBTERRANEAN SNAKE UNDERGROUND PULL OVERLAY */}
      {stats.undergroundPullTimer !== undefined && stats.undergroundPullTimer > 0 && (
        <div className="absolute inset-0 z-40 bg-amber-950/40 border-[20px] border-amber-900/80 pointer-events-none" />
      )}

      {/* SPIDER BLOOD DRAIN OVERLAY */}
      {stats.spiderBloodDrainActive && (
        <div className="absolute inset-0 z-40 bg-red-950/40 border-[16px] border-red-700/80 pointer-events-none animate-pulse" />
      )}

      {/* 18FT STICK SKINWALKER EAR SCREAM VISUAL FLASH (No Screen Text) */}
      {stats.earScreamScareActive && (
        <div className="absolute inset-0 z-50 bg-yellow-950/60 border-[24px] border-yellow-500/80 pointer-events-none animate-[pulse_0.05s_infinite]" />
      )}

      {/* NUN BLIND ATTACK OVERLAY (Total Darkness / Blindness) */}
      {stats.blindTimer !== undefined && stats.blindTimer > 0 && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-2">
            <div className="text-red-600 font-bold tracking-widest font-['Chakra_Petch'] text-2xl animate-pulse">EYES SEEARED BLIND!</div>
            <div className="text-neutral-500 text-xs font-mono">The Nun's dark curse has blinded your vision...</div>
          </div>
        </div>
      )}

      {/* SKINWALKER HORROR JUMP-SCARE OVERLAY */}
      {stats.skinwalkerJumpScareActive && (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center pointer-events-none animate-[pulse_0.1s_infinite]">
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <div className="flex gap-20 items-center justify-center animate-[bounce_0.08s_infinite] select-none">
              <div className="w-16 h-8 bg-gradient-to-r from-red-600 via-yellow-400 to-yellow-500 rounded-full shadow-[0_0_80px_#ef4444] transform -rotate-12 border-2 border-red-800 flex items-center justify-center">
                <div className="w-4 h-8 bg-black rounded-full" />
              </div>
              <div className="w-16 h-8 bg-gradient-to-l from-red-600 via-yellow-400 to-yellow-500 rounded-full shadow-[0_0_80px_#ef4444] transform rotate-12 border-2 border-red-800 flex items-center justify-center">
                <div className="w-4 h-8 bg-black rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. SCREEN BLOOD SPLATTER OVERLAY */}
      {stats.bloodOnScreen > 0 && (
        <div 
          className="absolute inset-0 bg-red-900/30 transition-opacity duration-300 pointer-events-none"
          style={{ 
            opacity: stats.bloodOnScreen,
            backgroundImage: `radial-gradient(circle at center, transparent 30%, rgba(180, 0, 0, 0.8) 90%)`
          }}
        >
          {/* Dynamic Blood Drips Edge */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-red-950 to-transparent opacity-80" />
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-red-950 to-transparent opacity-80" />
        </div>
      )}

      {/* 2. GREEN ACID SLIME SPLATTER OVERLAY */}
      {stats.greenAcidOnScreen > 0 && (
        <div 
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{ 
            opacity: stats.greenAcidOnScreen,
            backgroundImage: `radial-gradient(circle at center, transparent 20%, rgba(0, 200, 50, 0.7) 85%)`
          }}
        >
          <div className="absolute top-1/4 left-1/3 w-48 h-48 bg-emerald-600/50 rounded-full filter blur-xl animate-pulse" />
        </div>
      )}

      {/* 3. WHITE MIST OVERLAY */}
      {stats.whiteMistOnScreen > 0 && (
        <div 
          className="absolute inset-0 bg-white/20 filter blur-md transition-opacity duration-300 pointer-events-none"
          style={{ opacity: stats.whiteMistOnScreen }}
        />
      )}

      {/* 4. HEAVY PANTING / LOW HEALTH VIGNETTE */}
      {(stats.health < 35 || stats.isBreathingHeavy) && (
        <div className="absolute inset-0 border-[16px] border-red-600/40 animate-pulse pointer-events-none" />
      )}

      {/* 5. DEVELOPMENT CONTROL BOARD BUTTONS */}
      <div className="absolute top-4 left-4 pointer-events-auto flex flex-col gap-2">
        {!isLocked && (
          <div className="bg-neutral-900/90 border border-red-600/50 p-3 rounded-xl flex items-center gap-3 shadow-lg">
            <Target className="w-5 h-5 text-red-500 animate-pulse" />
            <div className="text-left text-xs">
              <div className="font-bold font-['Chakra_Petch'] text-white">TACTICAL SCREEN OVERLAY</div>
              <div className="text-neutral-400">Use on-screen buttons to Walk, Shoot, and Reload.</div>
            </div>
            <button 
              onClick={onUnlockPointer}
              className="px-2.5 py-1 bg-red-700 hover:bg-red-800 rounded font-mono text-[10px] text-white font-bold tracking-wider transition-colors"
            >
              CAPTURE LOCK
            </button>
          </div>
        )}

        {onOpenModManager && (
          <button 
            onClick={onOpenModManager}
            className="px-4 py-2.5 bg-neutral-900/90 border border-amber-500/60 hover:border-amber-400 rounded-xl text-[11px] font-extrabold font-['Chakra_Petch'] tracking-widest text-amber-300 hover:text-white flex items-center gap-2 shadow-xl hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all cursor-pointer"
          >
            <Cpu className="w-4 h-4 text-amber-400 animate-pulse" />
            📥 MODS & FILE IMPORTER
          </button>
        )}

        {onOpenSandbox && (
          <button 
            onClick={onOpenSandbox}
            className="px-4 py-2.5 bg-red-950/90 border border-red-500/60 hover:border-red-400 rounded-xl text-[11px] font-extrabold font-['Chakra_Petch'] tracking-widest text-red-400 hover:text-white flex items-center gap-2 shadow-xl hover:shadow-[0_0_15px_rgba(220,38,38,0.25)] transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-red-500" />
            🔧 DEV PHYSICS SANDBOX & SCRIPTS
          </button>
        )}
      </div>

      {/* 6. SNIPER SCOPE ADS OVERLAY */}
      {isAiming && weapon.id === 'sniper' && (
        <div className="absolute inset-0 bg-black flex items-center justify-center pointer-events-none">
          <div className="relative w-[550px] h-[550px] rounded-full border-4 border-neutral-800 bg-transparent flex items-center justify-center overflow-hidden">
            <div className="absolute inset-x-0 h-0.5 bg-red-600/80" />
            <div className="absolute inset-y-0 w-0.5 bg-red-600/80" />
            <div className="w-4 h-4 rounded-full border border-red-500" />
          </div>
        </div>
      )}

      {/* 7. DYNAMIC CROSSHAIR */}
      {(!isAiming || weapon.id !== 'sniper') && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
          <div className="absolute -top-3 w-0.5 h-2 bg-white/70" />
          <div className="absolute -bottom-3 w-0.5 h-2 bg-white/70" />
          <div className="absolute -left-3 w-2 h-0.5 bg-white/70" />
          <div className="absolute -right-3 w-2 h-0.5 bg-white/70" />
          
          {/* HITMARKER OVERLAY */}
          {stats.isHitmarkerActive && (
            <div className="absolute w-10 h-10 pointer-events-none animate-ping">
              {/* Top Left Diagonal Line */}
              <div className="absolute top-1 left-1 w-3.5 h-0.5 bg-red-500 rotate-45 transform origin-top-left" />
              {/* Top Right Diagonal Line */}
              <div className="absolute top-1 right-1 w-3.5 h-0.5 bg-red-500 -rotate-45 transform origin-top-right" />
              {/* Bottom Left Diagonal Line */}
              <div className="absolute bottom-1 left-1 w-3.5 h-0.5 bg-red-500 -rotate-45 transform origin-bottom-left" />
              {/* Bottom Right Diagonal Line */}
              <div className="absolute bottom-1 right-1 w-3.5 h-0.5 bg-red-500 rotate-45 transform origin-bottom-right" />
            </div>
          )}
        </div>
      )}

      {/* 8. TOP TACTICAL EVENT TICKER */}
      {gameEvent && (
        <div className="absolute top-6 inset-x-0 flex justify-center">
          <div className="px-5 py-2 bg-red-950/80 border border-red-600/60 rounded-lg text-xs font-bold text-red-200 tracking-wider font-['Chakra_Petch'] shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-bounce flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" /> {gameEvent}
          </div>
        </div>
      )}

      {/* 9. BOTTOM LEFT: VITAL STATS & ON-SCREEN WALKING CONTROLS */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 pointer-events-auto">
        {/* Active Stance Badge */}
        {(stats.isCrouched || stats.isProne || stats.isSliding) && (
          <div className="bg-red-950/90 border border-red-500/60 px-3 py-1.5 rounded-lg font-['Chakra_Petch'] text-[10px] font-bold text-red-200 tracking-wider animate-pulse flex items-center gap-2 w-max shadow-lg">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
            {stats.isSliding ? "TACTICAL SLIDE ACTIVE" : (stats.isProne ? "PRONE POSITION" : "CROUCHED STANCE")}
          </div>
        )}

        <div className="flex items-end justify-between gap-2">
          {/* On-screen Walking Panel */}
          <div className="bg-neutral-950/95 border border-neutral-800/80 p-3 rounded-xl flex flex-col items-center gap-2 w-max shadow-2xl scale-90 origin-bottom-left">
            <span className="text-[9px] font-bold tracking-widest text-neutral-400 font-['Chakra_Petch'] mb-1 uppercase">Movement</span>
            
            <button
              onMouseDown={() => onMoveForward(true)}
              onMouseUp={() => onMoveForward(false)}
              onMouseLeave={() => onMoveForward(false)}
              onTouchStart={() => onMoveForward(true)}
              onTouchEnd={() => onMoveForward(false)}
              className="p-3 bg-neutral-900 border border-neutral-700 active:bg-red-950 active:border-red-500 rounded-lg flex items-center justify-center shadow transition-all duration-150"
            >
              <MoveUp className="w-5 h-5 text-white" />
            </button>

            <div className="flex gap-2">
              <button
                onMouseDown={() => onMoveLeft(true)}
                onMouseUp={() => onMoveLeft(false)}
                onMouseLeave={() => onMoveLeft(false)}
                onTouchStart={() => onMoveLeft(true)}
                onTouchEnd={() => onMoveLeft(false)}
                className="p-3 bg-neutral-900 border border-neutral-700 active:bg-red-950 active:border-red-500 rounded-lg flex items-center justify-center shadow transition-all duration-150"
              >
                <MoveLeft className="w-5 h-5 text-white" />
              </button>

              <button
                onMouseDown={() => onMoveBackward(true)}
                onMouseUp={() => onMoveBackward(false)}
                onMouseLeave={() => onMoveBackward(false)}
                onTouchStart={() => onMoveBackward(true)}
                onTouchEnd={() => onMoveBackward(false)}
                className="p-3 bg-neutral-900 border border-neutral-700 active:bg-red-950 active:border-red-500 rounded-lg flex items-center justify-center shadow transition-all duration-150"
              >
                <MoveDown className="w-5 h-5 text-white" />
              </button>

              <button
                onMouseDown={() => onMoveRight(true)}
                onMouseUp={() => onMoveRight(false)}
                onMouseLeave={() => onMoveRight(false)}
                onTouchStart={() => onMoveRight(true)}
                onTouchEnd={() => onMoveRight(false)}
                className="p-3 bg-neutral-900 border border-neutral-700 active:bg-red-950 active:border-red-500 rounded-lg flex items-center justify-center shadow transition-all duration-150"
              >
                <MoveRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Action Buttons (Shoot/Reload) */}
          <div className="flex flex-col gap-2 items-end scale-90 origin-bottom-right">
            <button
              onClick={onReload}
              className="px-4 py-2.5 bg-amber-950/80 border border-amber-600 hover:border-amber-400 text-amber-400 rounded-xl font-bold text-[10px] tracking-wider font-['Chakra_Petch'] flex items-center gap-2 transition-all active:scale-95 shadow-md"
            >
              <RotateCw className="w-4 h-4" /> RELOAD
            </button>

            <button
              onClick={onShoot}
              className="px-6 py-4 bg-red-700 hover:bg-red-600 border border-red-500 rounded-xl font-extrabold text-xs tracking-widest font-['Chakra_Petch'] text-white flex items-center gap-2 transition-all active:scale-95 shadow-lg"
            >
              <Crosshair className="w-5 h-5" /> SHOOT
            </button>
          </div>
        </div>

        {/* 18 Hearts Health & Stamina combined compact card */}
        <div className="flex flex-col gap-2 bg-black/80 backdrop-blur-md border border-neutral-800 p-3 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 fill-red-500 text-red-500 animate-pulse" />
              <span className="text-[10px] font-bold font-['Chakra_Petch'] text-red-400 uppercase tracking-widest">Health</span>
            </div>
            <span className="text-[10px] font-mono text-white">{Math.round(stats.health)}%</span>
          </div>
          
          <div className="grid grid-cols-9 gap-1 pb-1">
            {Array.from({ length: 18 }).map((_, i) => {
              const heartValue = (stats.health / stats.maxHealth) * 18;
              const isFull = heartValue >= i + 0.85;
              const isHalf = heartValue > i + 0.15 && heartValue < i + 0.85;
              return (
                <div key={i} className="flex items-center justify-center">
                  {isFull ? (
                    <Heart className="w-3 h-3 fill-red-500 text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
                  ) : isHalf ? (
                    <Heart className="w-3 h-3 fill-red-800 text-red-500 opacity-80" />
                  ) : (
                    <Heart className="w-3 h-3 text-neutral-800 fill-neutral-950" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 border-t border-neutral-800 pt-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <div className="flex-1 h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
              <div 
                className="h-full bg-amber-500 transition-all duration-150"
                style={{ width: `${(stats.stamina / stats.maxStamina) * 100}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-amber-500">{Math.round(stats.stamina)}%</span>
          </div>
        </div>

        {/* Weapons Loadout HUD Bar (Now scrollable if many weapons) */}
        {stats.unlockedWeapons && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar max-w-full">
            {stats.unlockedWeapons.split(',').map((wId, i) => {
              const isActive = weapon.id === wId;
              const nameMap: Record<string, { label: string; icon: string }> = {
                fast_guy: { label: 'FAST', icon: '⚡' },
                dragon_gun: { label: 'DRAGON', icon: '🐉' },
                whip: { label: 'WHIP', icon: '🪢' },
                underground_gun: { label: 'DRILL', icon: '⛏️' },
                m4a1: { label: 'M4A1', icon: '🔫' },
                ak47: { label: 'AK47', icon: '⚔️' },
                shotgun: { label: '870', icon: '💥' },
                sniper: { label: '.50', icon: '🎯' },
                minigun: { label: 'M134', icon: '⚡' },
                smoke_grenade: { label: 'SMOKE', icon: '💨' },
                grenade: { label: 'FRAG', icon: '💣' }
              };
              const meta = nameMap[wId] || { label: wId.substring(0, 4).toUpperCase(), icon: '🔫' };
              return (
                <button
                  key={wId}
                  onClick={() => onSwitchWeaponSlot?.(i)}
                  className={`px-2 py-1 rounded-lg border font-mono text-[9px] font-bold tracking-tight transition-all select-none cursor-pointer flex items-center gap-1 shrink-0 ${
                    isActive 
                      ? 'bg-red-950/95 border-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.6)]' 
                      : 'bg-black/80 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <span>{meta.icon}</span>
                  <span className="font-['Chakra_Petch']">{meta.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* DOWNED TEAMMATE PROXIMITY REVIVE BUTTON */}
      {downedTeammateName && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 pointer-events-auto z-40 animate-bounce">
          <button
            onClick={onRevive}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 border-2 border-yellow-300 text-white font-['Chakra_Petch'] font-black text-xs rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.8)] flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <Heart className="w-5 h-5 fill-yellow-300 text-yellow-300 animate-pulse" />
            <span>REVIVE {downedTeammateName.toUpperCase()} [E]</span>
          </button>
        </div>
      )}

      {/* 11. TOP HUD: TIMER, CO-OP STATUS & AMMO */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        {/* Left: Survival Timer & Co-op indicator */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-black/70 backdrop-blur-md border border-neutral-800 p-2 rounded-xl text-right font-mono text-[10px]">
            <div className="text-neutral-500 uppercase tracking-tighter">Time</div>
            <div className="text-sm font-bold text-red-500 font-['Chakra_Petch'] leading-tight">
              {Math.floor(stats.survivalSeconds / 60).toString().padStart(2, '0')}:{(stats.survivalSeconds % 60).toString().padStart(2, '0')}
            </div>
          </div>

          {isMultiplayer && (
            <div className="flex items-center gap-1.5">
              <div className="bg-cyan-950/80 border border-cyan-500/70 px-2.5 py-1.5 rounded-xl font-mono text-[10px] text-cyan-200 flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-['Chakra_Petch'] font-bold">CO-OP MATCH</span>
              </div>
              {onLeaveMultiplayer && (
                <button
                  onClick={onLeaveMultiplayer}
                  className="bg-neutral-900/90 hover:bg-red-950/90 border border-neutral-700 hover:border-red-600 px-2 py-1.5 rounded-xl font-mono text-[9px] text-neutral-300 hover:text-red-300 transition-colors"
                >
                  LEAVE
                </button>
              )}
            </div>
          )}
        </div>

        {/* Ammo Display */}
        <div className="bg-black/70 backdrop-blur-md border border-red-950 p-2 rounded-xl text-right min-w-[100px] pointer-events-auto">
          <div className="text-[9px] font-bold text-red-500 uppercase tracking-widest font-['Chakra_Petch'] leading-tight">
            {weapon.name}
          </div>
          <div className="flex items-baseline justify-end gap-0.5 font-['Chakra_Petch'] mt-0.5">
            <span className={`text-2xl font-extrabold ${weapon.currentAmmo === 0 ? 'text-red-600 animate-pulse' : 'text-white'}`}>
              {weapon.currentAmmo}
            </span>
            <span className="text-xs text-neutral-500 font-bold">/ {weapon.totalReserve}</span>
          </div>
        </div>
      </div>

      {/* DEVELOPER DEBUG OVERLAY (Toggled via `~` KeyBackquote) */}
      {stats.isDebugActive && (
        <div className="absolute top-20 right-4 left-4 bg-black/95 border border-emerald-500/60 p-3 rounded-xl font-mono text-[9px] text-emerald-400 shadow-2xl z-40">
          <div className="font-bold text-[10px] text-emerald-300 font-['Chakra_Petch'] border-b border-emerald-800 pb-1 mb-2 flex justify-between items-center uppercase tracking-widest">
            <span>AI Rig Debug</span>
            <span className="bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-600">LIVE</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div><span className="text-neutral-500">Weapon:</span> <b className="text-white">{weapon.name}</b></div>
            <div><span className="text-neutral-500">Phase:</span> <b className="text-amber-400 uppercase">{stats.directorState?.phase || 'QUIET'}</b></div>
            <div><span className="text-neutral-500">Tension:</span> <b className="text-red-400">{Math.round(stats.directorState?.tension || 0)}%</b></div>
            <div><span className="text-neutral-500">Panic:</span> <b className={stats.directorState?.panicActive ? 'text-red-500' : 'text-neutral-500'}>{stats.directorState?.panicActive ? 'YES' : 'NO'}</b></div>
          </div>
        </div>
      )}

    </div>
  );
};
