import React from 'react';
import { PlayerStats, Weapon } from '../types/game';
import { Shield, Zap, Crosshair, Radio, Flashlight, Target, MoveUp, MoveDown, MoveLeft, MoveRight, RotateCw, Sliders, Heart } from 'lucide-react';

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
  onOpenSandbox
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-20 select-none font-['Plus_Jakarta_Sans']">
      
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
      <div className="absolute bottom-6 left-6 flex flex-col gap-3 pointer-events-auto">
        {/* Active Stance Badge */}
        {(stats.isCrouched || stats.isProne || stats.isSliding) && (
          <div className="bg-red-950/90 border border-red-500/60 px-3 py-1.5 rounded-lg font-['Chakra_Petch'] text-[10px] font-bold text-red-200 tracking-wider animate-pulse flex items-center gap-2 w-max shadow-lg">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
            {stats.isSliding ? "TACTICAL SLIDE ACTIVE" : (stats.isProne ? "PRONE POSITION" : "CROUCHED STANCE")}
          </div>
        )}

        {/* On-screen Walking Panel (Strictly Walk, Shoot, Reload!) */}
        <div className="bg-neutral-950/95 border border-neutral-800/80 p-4 rounded-xl flex flex-col items-center gap-2 w-max shadow-2xl">
          <span className="text-[10px] font-bold tracking-widest text-neutral-400 font-['Chakra_Petch'] mb-1">WALK MOVEMENT</span>
          
          <button
            onMouseDown={() => onMoveForward(true)}
            onMouseUp={() => onMoveForward(false)}
            onMouseLeave={() => onMoveForward(false)}
            onTouchStart={() => onMoveForward(true)}
            onTouchEnd={() => onMoveForward(false)}
            className="p-3 bg-neutral-900 border border-neutral-700 active:bg-red-950 active:border-red-500 rounded-lg flex items-center justify-center shadow transition-all duration-150"
            title="Walk Forward"
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
              title="Walk Left"
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
              title="Walk Backward"
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
              title="Walk Right"
            >
              <MoveRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Tactical keys reminder */}
          <div className="mt-2 text-[9px] text-neutral-400 font-mono flex flex-col gap-0.5 border-t border-neutral-900 pt-2 text-left w-full">
            <div>• <b className="text-white">C / CTRL:</b> Toggle Crouch</div>
            <div>• <b className="text-white">C (during Sprint):</b> Slide</div>
            <div>• <b className="text-white">Z key:</b> Dolphin Dive</div>
          </div>
        </div>

        {/* 18 Hearts Health Display Card in Bottom Left Corner */}
        <div className="bg-black/80 backdrop-blur-md border border-red-900/60 p-3.5 rounded-xl w-72 shadow-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold font-['Chakra_Petch']">
            <span className="text-red-400 flex items-center gap-1.5 tracking-wider">
              <Heart className="w-4 h-4 fill-red-500 text-red-500 animate-pulse" /> VITAL HEALTH (18 HEARTS)
            </span>
            <span className={stats.health < 30 ? 'text-red-500 font-extrabold animate-pulse' : 'text-white'}>
              {Math.round(stats.health)}%
            </span>
          </div>

          <div className="text-[9px] text-amber-400/90 font-mono tracking-tight text-left">
            ⏳ SLOTH HEALTH DECAY: 18 HEARTS DRAIN OVER 3 TO 7 HOURS
          </div>

          {/* 18 Hearts Grid (2 rows of 9 hearts) */}
          <div className="grid grid-cols-9 gap-1.5 pt-0.5 pb-0.5">
            {Array.from({ length: 18 }).map((_, i) => {
              const heartValue = (stats.health / stats.maxHealth) * 18;
              const isFull = heartValue >= i + 0.85;
              const isHalf = heartValue > i + 0.15 && heartValue < i + 0.85;

              return (
                <div key={i} className="flex items-center justify-center">
                  {isFull ? (
                    <Heart className="w-4 h-4 fill-red-500 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.9)] animate-pulse" />
                  ) : isHalf ? (
                    <Heart className="w-4 h-4 fill-red-800 text-red-500 opacity-80" />
                  ) : (
                    <Heart className="w-4 h-4 text-neutral-800 fill-neutral-950" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-neutral-800">
            <div 
              className={`h-full transition-all duration-300 ${stats.health < 30 ? 'bg-red-600' : 'bg-emerald-500'}`}
              style={{ width: `${Math.max(0, (stats.health / stats.maxHealth) * 100)}%` }}
            />
          </div>
        </div>

        {/* Stamina Bar */}
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md border border-neutral-800 p-3 rounded-xl w-64 shadow-lg">
          <Zap className="w-6 h-6 text-amber-500 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs font-bold font-['Chakra_Petch'] mb-1">
              <span className="text-neutral-400">STAMINA / FATIGUE</span>
              <span className="text-white">{Math.round(stats.stamina)}%</span>
            </div>
            <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
              <div 
                className="h-full bg-amber-500 transition-all duration-150"
                style={{ width: `${(stats.stamina / stats.maxStamina) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 10. BOTTOM RIGHT: SHOOT & RELOAD PANEL (Explicit mechanical controls requested) */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-auto">
        {/* On-screen Shoot & Reload Command deck */}
        <div className="bg-neutral-950/95 border border-neutral-800 p-4 rounded-xl flex items-center gap-4 shadow-2xl">
          {/* Reload Weapon Button */}
          <button
            onClick={onReload}
            className="px-5 py-3 bg-amber-950/80 border border-amber-600 hover:border-amber-400 text-amber-400 rounded-xl font-bold text-xs tracking-wider font-['Chakra_Petch'] flex items-center gap-2 transition-all select-none active:scale-95 shadow-md"
          >
            <RotateCw className="w-4 h-4" /> RELOAD WEAPON
          </button>

          {/* Shoot Weapon Button */}
          <button
            onClick={onShoot}
            className="px-8 py-4 bg-red-700 hover:bg-red-600 border border-red-500 rounded-xl font-extrabold text-sm tracking-widest font-['Chakra_Petch'] text-white flex items-center gap-2 transition-all active:scale-95 shadow-lg animate-pulse"
          >
            <Crosshair className="w-5 h-5 animate-spin" /> SHOOT TARGET
          </button>
        </div>

        {/* WEAPONS LOADOUT HUD BAR */}
        {stats.unlockedWeapons && (
          <div className="flex flex-wrap gap-2 justify-end w-full max-w-[480px] mb-2">
            {stats.unlockedWeapons.split(',').map((wId, i) => {
              const isActive = weapon.id === wId;
              const nameMap: Record<string, { label: string; icon: string }> = {
                fast_guy: { label: 'THE FAST GUY', icon: '⚡' },
                dragon_gun: { label: 'DRAGON GUN', icon: '🐉' },
                whip: { label: 'CONTROL WHIP', icon: '🪢' },
                underground_gun: { label: 'SEISMIC DRILLER', icon: '⛏️' },
                m4a1: { label: 'M4A1 CARBINE', icon: '🔫' },
                ak47: { label: 'AK-47 SOVIET', icon: '⚔️' },
                shotgun: { label: 'REMINGTON 870', icon: '💥' },
                sniper: { label: 'BARRETT .50', icon: '🎯' },
                minigun: { label: 'M134 VULCAN', icon: '⚡' },
                smoke_grenade: { label: 'SMOKE GRENADE', icon: '💨' },
                grenade: { label: 'FRAG GRENADE', icon: '💣' }
              };
              const meta = nameMap[wId] || { label: wId.toUpperCase(), icon: '🔫' };
              return (
                <button
                  key={wId}
                  onClick={() => onSwitchWeaponSlot?.(i)}
                  className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] font-bold tracking-wider transition-all select-none cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-md ${
                    isActive 
                      ? 'bg-red-950/95 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] scale-105 ring-2 ring-red-500/50' 
                      : 'bg-black/80 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600'
                  }`}
                >
                  <span className="w-4 h-4 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center text-[9px] text-amber-400 font-bold font-['Chakra_Petch']">
                    {i + 1}
                  </span>
                  <span className="text-xs">{meta.icon}</span>
                  <span className="font-['Chakra_Petch'] font-extrabold">{meta.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="bg-black/70 backdrop-blur-md border border-red-900/40 p-4 rounded-xl text-right min-w-[200px] shadow-lg">
          <div className="text-xs font-bold text-red-500 uppercase tracking-widest font-['Chakra_Petch']">
            {weapon.name}
          </div>
          <div className="text-[10px] text-neutral-400 font-mono mb-2">{weapon.category}</div>

          <div className="flex items-baseline justify-end gap-1 font-['Chakra_Petch']">
            <span className={`text-4xl font-extrabold ${weapon.currentAmmo === 0 ? 'text-red-600 animate-pulse' : 'text-white'}`}>
              {weapon.currentAmmo}
            </span>
            <span className="text-lg text-neutral-500 font-bold">/ {weapon.totalReserve}</span>
          </div>

          {isReloading && (
            <div className="text-xs font-bold text-amber-400 font-mono animate-pulse mt-1">
              RELOADING WEAPON...
            </div>
          )}
        </div>
      </div>

      {/* 11. TOP RIGHT: TACTICAL RADAR & SURVIVAL TIMER */}
      <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
        <div className="bg-black/70 backdrop-blur-md border border-neutral-800 p-3 rounded-xl text-right font-mono text-xs">
          <div className="text-neutral-400">SURVIVAL TIME</div>
          <div className="text-lg font-bold text-red-500 font-['Chakra_Petch']">
            {Math.floor(stats.survivalSeconds / 60).toString().padStart(2, '0')}:{(stats.survivalSeconds % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">KILLS: {stats.kills} | HEADSHOTS: {stats.headshots}</div>
        </div>
      </div>

      {/* DEVELOPER DEBUG OVERLAY (Toggled via `~` KeyBackquote) */}
      {stats.isDebugActive && (
        <div className="absolute top-20 right-6 bg-black/90 border border-emerald-500/60 p-3.5 rounded-xl font-mono text-[11px] text-emerald-400 w-80 shadow-2xl z-40">
          <div className="font-bold text-xs text-emerald-300 font-['Chakra_Petch'] border-b border-emerald-800 pb-1 mb-2 flex justify-between items-center">
            <span>🛠️ DEVELOPER AI & RIG DEBUG</span>
            <span className="text-[9px] bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-400 border border-emerald-600">LIVE</span>
          </div>
          <div className="space-y-1">
            <div><span className="text-neutral-400">Weapon Active:</span> <b className="text-white">{weapon.name}</b></div>
            <div><span className="text-neutral-400">Two-Handed IK:</span> <b className="text-emerald-400">L_Hand & R_Hand Locked</b></div>
            <div><span className="text-neutral-400">Director Phase:</span> <b className="text-amber-400 uppercase">{stats.directorState?.phase || 'QUIET'}</b></div>
            <div><span className="text-neutral-400">Director Tension:</span> <b className="text-red-400">{Math.round(stats.directorState?.tension || 0)}%</b></div>
            <div><span className="text-neutral-400">Panic Event Active:</span> <b className={stats.directorState?.panicActive ? 'text-red-500 animate-pulse' : 'text-neutral-500'}>{stats.directorState?.panicActive ? 'YES' : 'NO'}</b></div>
            <div><span className="text-neutral-400">Skinwalker Mindscare:</span> <b className={stats.skinwalkerJumpScareActive ? 'text-purple-400 animate-pulse' : 'text-neutral-500'}>{stats.skinwalkerJumpScareActive ? 'ACTIVE' : 'IDLE'}</b></div>
            <div className="text-[9px] text-neutral-500 border-t border-neutral-800 pt-1 mt-2">
              Press [~] (Backquote) to hide debug overlay
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
