import React, { useState } from 'react';
import { PlayerStats, Weapon } from '../types/game';
import { MultiplayerRoom } from '../types/multiplayer';
import { Crosshair, Radio, RotateCw, Heart, Zap, Target, Users, Sliders, LogOut, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ExitConfirmationModal } from './ExitConfirmationModal';

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
  onExitMultiplayer?: () => void;
  multiplayerRoom?: MultiplayerRoom | null;
  mySessionId?: string | null;
  ping?: number;
}

const WEAPON_META: Record<string, { label: string; icon: string; short: string }> = {
  fast_guy: { label: 'THE FAST GUY', icon: '⚡', short: 'FAST GUY' },
  dragon_gun: { label: 'DRAGON GUN', icon: '🐉', short: 'DRAGON' },
  whip: { label: 'CONTROL WHIP', icon: '🪢', short: 'WHIP' },
  underground_gun: { label: 'SEISMIC DRILLER', icon: '⛏️', short: 'DRILLER' },
  m4a1: { label: 'M4A1 CARBINE', icon: '🔫', short: 'M4A1' },
  shotgun: { label: 'REMINGTON 870', icon: '💥', short: 'SHOTGUN' },
  sniper: { label: 'BARRETT .50', icon: '🎯', short: 'SNIPER' },
  minigun: { label: 'M134 VULCAN', icon: '⚡', short: 'MINIGUN' },
  smoke_grenade: { label: 'SMOKE GRENADE', icon: '💨', short: 'SMOKE' },
  grenade: { label: 'FRAG GRENADE', icon: '💣', short: 'GRENADE' }
};

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
  onExitMultiplayer,
  multiplayerRoom,
  mySessionId,
  ping
}) => {
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState<boolean>(false);
  const unlockedList = stats.unlockedWeapons ? stats.unlockedWeapons.split(',') : [];

  const handleBarWheel = (e: React.WheelEvent) => {
    if (!onSwitchWeaponSlot || unlockedList.length === 0) return;
    const currentIdx = unlockedList.indexOf(weapon.id);
    if (e.deltaY > 0) {
      const nextIdx = (currentIdx + 1) % unlockedList.length;
      onSwitchWeaponSlot(nextIdx);
    } else if (e.deltaY < 0) {
      const prevIdx = (currentIdx - 1 + unlockedList.length) % unlockedList.length;
      onSwitchWeaponSlot(prevIdx);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-20 select-none font-['Plus_Jakarta_Sans']">
      
      {/* 1. VISUAL STATUS & ATMOSPHERIC EFFECTS (Non-blocking Horror Atmospherics) */}
      {stats.iceFrozenTimer !== undefined && stats.iceFrozenTimer > 0 && (
        <div className="absolute inset-0 z-40 bg-cyan-950/30 border-[16px] border-cyan-400/70 backdrop-blur-[2px] pointer-events-none animate-pulse" />
      )}

      {stats.undergroundPullTimer !== undefined && stats.undergroundPullTimer > 0 && (
        <div className="absolute inset-0 z-40 bg-amber-950/40 border-[18px] border-amber-900/80 pointer-events-none" />
      )}

      {stats.spiderBloodDrainActive && (
        <div className="absolute inset-0 z-40 bg-red-950/40 border-[14px] border-red-700/80 pointer-events-none animate-pulse" />
      )}

      {stats.earScreamScareActive && (
        <div className="absolute inset-0 z-50 bg-yellow-950/60 border-[20px] border-yellow-500/80 pointer-events-none animate-[pulse_0.05s_infinite]" />
      )}

      {stats.skinwalkerJumpScareActive && (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center pointer-events-none animate-[pulse_0.1s_infinite]">
          <div className="flex gap-20 items-center justify-center animate-[bounce_0.08s_infinite] select-none">
            <div className="w-16 h-8 bg-gradient-to-r from-red-600 via-yellow-400 to-yellow-500 rounded-full shadow-[0_0_80px_#ef4444] transform -rotate-12 border-2 border-red-800 flex items-center justify-center">
              <div className="w-4 h-8 bg-black rounded-full" />
            </div>
            <div className="w-16 h-8 bg-gradient-to-l from-red-600 via-yellow-400 to-yellow-500 rounded-full shadow-[0_0_80px_#ef4444] transform rotate-12 border-2 border-red-800 flex items-center justify-center">
              <div className="w-4 h-8 bg-black rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Screen Blood Splatter Overlay */}
      {stats.bloodOnScreen > 0 && (
        <div 
          className="absolute inset-0 bg-red-900/30 transition-opacity duration-300 pointer-events-none"
          style={{ 
            opacity: stats.bloodOnScreen,
            backgroundImage: `radial-gradient(circle at center, transparent 35%, rgba(180, 0, 0, 0.75) 90%)`
          }}
        />
      )}

      {/* Green Acid Splatter */}
      {stats.greenAcidOnScreen > 0 && (
        <div 
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{ 
            opacity: stats.greenAcidOnScreen,
            backgroundImage: `radial-gradient(circle at center, transparent 25%, rgba(0, 200, 50, 0.6) 85%)`
          }}
        />
      )}

      {/* White Mist Overlay */}
      {stats.whiteMistOnScreen > 0 && (
        <div 
          className="absolute inset-0 bg-white/20 filter blur-md transition-opacity duration-300 pointer-events-none"
          style={{ opacity: stats.whiteMistOnScreen }}
        />
      )}

      {/* Low Health Vignette */}
      {(stats.health < 35 || stats.isBreathingHeavy) && (
        <div className="absolute inset-0 border-[14px] border-red-600/40 animate-pulse pointer-events-none" />
      )}

      {/* 2. TOP BAR: MINIMAL & UNOBTRUSIVE */}
      <div className="absolute top-4 inset-x-4 flex items-start justify-between pointer-events-none z-30">
        {/* Left: Subtle Pointer Capture Prompt (Only if not locked) */}
        <div>
          {!isLocked && (
            <button 
              onClick={onUnlockPointer}
              className="pointer-events-auto px-3 py-1.5 bg-black/70 hover:bg-neutral-900 border border-neutral-700/80 rounded-lg text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-2 shadow-lg backdrop-blur-sm transition-all cursor-pointer"
            >
              <Target className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>Click Screen to Aim</span>
            </button>
          )}
        </div>

        {/* Center: Quiet Tactical Event Toast (Only appears when active) */}
        {gameEvent && (
          <div className="pointer-events-none transition-all animate-fade-in max-w-md mx-auto">
            <div className="px-4 py-1.5 bg-black/80 backdrop-blur-md border border-red-600/50 rounded-full text-xs font-mono text-red-200 shadow-xl flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />
              <span className="truncate tracking-wide">{gameEvent}</span>
            </div>
          </div>
        )}

        {/* Right: Sleek Survival Timer, Kills & Squad Badge */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-black/60 backdrop-blur-md border border-neutral-800/80 px-3.5 py-1.5 rounded-xl font-mono text-xs flex items-center gap-3 text-neutral-300 shadow-lg">
              <span className="text-red-400 font-bold font-['Chakra_Petch'] text-sm tracking-wider">
                {Math.floor(stats.survivalSeconds / 60).toString().padStart(2, '0')}:{(stats.survivalSeconds % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-neutral-700">|</span>
              <span className="text-neutral-400">KILLS: <b className="text-white">{stats.kills}</b></span>
              <span className="text-neutral-700">·</span>
              <span className="text-neutral-400">HEADSHOTS: <b className="text-emerald-400">{stats.headshots}</b></span>
            </div>

            {onOpenSandbox && (
              <button
                onClick={onOpenSandbox}
                title="Open Sandbox Tuning"
                className="p-2 bg-black/60 hover:bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700 rounded-xl text-neutral-400 hover:text-white transition-all shadow-lg cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Multiplayer Squad Card */}
          {multiplayerRoom && (
            <div className="bg-neutral-950/85 backdrop-blur-md border border-neutral-800/80 rounded-xl p-2.5 shadow-xl min-w-48 text-left">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 font-bold font-['Chakra_Petch'] text-xs text-white">
                  <Users className="w-3.5 h-3.5 text-red-500" />
                  <span>SQUAD [{multiplayerRoom.roomCode}]</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {ping || 25}ms
                </span>
              </div>
              <div className="space-y-1.5">
                {Object.values(multiplayerRoom.players).map((p) => {
                  const isMe = p.sessionId === mySessionId;
                  const hp = isMe ? stats.health : p.health;
                  return (
                    <div key={p.sessionId} className="text-[10px] font-mono">
                      <div className="flex items-center justify-between text-neutral-300">
                        <span className="font-semibold flex items-center gap-1">
                          {p.name}
                          {p.isHost && <span className="text-[8px] bg-red-600 text-white px-1 py-0.2 rounded font-bold">H</span>}
                          {isMe && <span className="text-[8px] bg-neutral-800 text-neutral-400 px-1 py-0.2 rounded">YOU</span>}
                        </span>
                        <span className="text-neutral-400">{Math.round(hp)} HP</span>
                      </div>
                      <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden mt-0.5 border border-neutral-800">
                        <div 
                          className={`h-full ${hp > 50 ? 'bg-emerald-500' : (hp > 25 ? 'bg-amber-500' : 'bg-red-500')}`} 
                          style={{ width: `${Math.min(100, Math.max(0, hp))}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* In-Game Multiplayer Exit Button */}
              {onExitMultiplayer && (
                <button
                  onClick={() => setIsExitConfirmOpen(true)}
                  className="w-full mt-2.5 py-2 px-3 bg-red-950/80 hover:bg-red-900 border border-red-700/60 hover:border-red-500 rounded-lg text-xs font-bold font-['Chakra_Petch'] text-red-200 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>EXIT MULTIPLAYER</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. CENTER CROSSHAIR / AIMING RETICLE */}
      {isAiming && weapon.id === 'sniper' ? (
        <div className="absolute inset-0 bg-black flex items-center justify-center pointer-events-none">
          <div className="relative w-[520px] h-[520px] rounded-full border-4 border-neutral-800 bg-transparent flex items-center justify-center overflow-hidden">
            <div className="absolute inset-x-0 h-0.5 bg-red-600/80" />
            <div className="absolute inset-y-0 w-0.5 bg-red-600/80" />
            <div className="w-4 h-4 rounded-full border border-red-500" />
          </div>
        </div>
      ) : (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
          <div className="absolute -top-3 w-0.5 h-2 bg-white/70" />
          <div className="absolute -bottom-3 w-0.5 h-2 bg-white/70" />
          <div className="absolute -left-3 w-2 h-0.5 bg-white/70" />
          <div className="absolute -right-3 w-2 h-0.5 bg-white/70" />
          
          {stats.isHitmarkerActive && (
            <div className="absolute w-8 h-8 pointer-events-none animate-ping">
              <div className="absolute top-0.5 left-0.5 w-3 h-0.5 bg-red-500 rotate-45 transform origin-top-left" />
              <div className="absolute top-0.5 right-0.5 w-3 h-0.5 bg-red-500 -rotate-45 transform origin-top-right" />
              <div className="absolute bottom-0.5 left-0.5 w-3 h-0.5 bg-red-500 -rotate-45 transform origin-bottom-left" />
              <div className="absolute bottom-0.5 right-0.5 w-3 h-0.5 bg-red-500 rotate-45 transform origin-bottom-right" />
            </div>
          )}
        </div>
      )}

      {/* 4. BOTTOM LEFT: TACTICAL D-PAD (PS5/XBOX STYLE) & VITAL HEALTH */}
      <div className="absolute bottom-20 left-8 flex items-end gap-10 pointer-events-none z-30">
        {/* Unified Premium D-Pad Unit */}
        <div className="pointer-events-auto relative w-44 h-44 bg-neutral-900/40 backdrop-blur-md rounded-full border border-white/5 shadow-2xl flex items-center justify-center">
          {/* Inner Housing Detail */}
          <div className="absolute inset-4 rounded-full border border-white/5 bg-neutral-950/40 shadow-inner" />
          
          {/* Cross Plate Housing (Cohesive unit look) */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            
            {/* UP BUTTON */}
            <button
              onMouseDown={() => onMoveForward(true)}
              onMouseUp={() => onMoveForward(false)}
              onMouseLeave={() => onMoveForward(false)}
              onTouchStart={() => onMoveForward(true)}
              onTouchEnd={() => onMoveForward(false)}
              className="absolute top-0 w-12 h-14 rounded-t-xl bg-neutral-800 border-x-2 border-t-2 border-neutral-700 shadow-[0_-2px_10px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.05)] active:bg-red-900/60 active:border-red-500/50 transition-all flex flex-col items-center justify-start pt-2 cursor-pointer group"
            >
              <div className="w-1 h-3 bg-neutral-700 rounded-full mb-1 group-active:bg-red-400 opacity-50" />
              <ChevronUp className="w-6 h-6 text-neutral-400 group-active:text-white transition-colors" />
            </button>

            {/* DOWN BUTTON */}
            <button
              onMouseDown={() => onMoveBackward(true)}
              onMouseUp={() => onMoveBackward(false)}
              onMouseLeave={() => onMoveBackward(false)}
              onTouchStart={() => onMoveBackward(true)}
              onTouchEnd={() => onMoveBackward(false)}
              className="absolute bottom-0 w-12 h-14 rounded-b-xl bg-neutral-800 border-x-2 border-b-2 border-neutral-700 shadow-[0_2px_10px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(255,255,255,0.05)] active:bg-red-900/60 active:border-red-500/50 transition-all flex flex-col items-center justify-end pb-2 cursor-pointer group"
            >
              <ChevronDown className="w-6 h-6 text-neutral-400 group-active:text-white transition-colors" />
              <div className="w-1 h-3 bg-neutral-700 rounded-full mt-1 group-active:bg-red-400 opacity-50" />
            </button>

            {/* LEFT BUTTON */}
            <button
              onMouseDown={() => onMoveLeft(true)}
              onMouseUp={() => onMoveLeft(false)}
              onMouseLeave={() => onMoveLeft(false)}
              onTouchStart={() => onMoveLeft(true)}
              onTouchEnd={() => onMoveLeft(false)}
              className="absolute left-0 w-14 h-12 rounded-l-xl bg-neutral-800 border-y-2 border-l-2 border-neutral-700 shadow-[-2px_0_10px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.05)] active:bg-red-900/60 active:border-red-500/50 transition-all flex items-center justify-start pl-2 cursor-pointer group"
            >
              <div className="w-3 h-1 bg-neutral-700 rounded-full mr-1 group-active:bg-red-400 opacity-50" />
              <ChevronLeft className="w-6 h-6 text-neutral-400 group-active:text-white transition-colors" />
            </button>

            {/* RIGHT BUTTON */}
            <button
              onMouseDown={() => onMoveRight(true)}
              onMouseUp={() => onMoveRight(false)}
              onMouseLeave={() => onMoveRight(false)}
              onTouchStart={() => onMoveRight(true)}
              onTouchEnd={() => onMoveRight(false)}
              className="absolute right-0 w-14 h-12 rounded-r-xl bg-neutral-800 border-y-2 border-r-2 border-neutral-700 shadow-[2px_0_10px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.05)] active:bg-red-900/60 active:border-red-500/50 transition-all flex items-center justify-end pr-2 cursor-pointer group"
            >
              <ChevronRight className="w-6 h-6 text-neutral-400 group-active:text-white transition-colors" />
              <div className="w-3 h-1 bg-neutral-700 rounded-full ml-1 group-active:bg-red-400 opacity-50" />
            </button>

            {/* CENTRAL HUB DETAIL */}
            <div className="w-10 h-10 bg-neutral-800 border-2 border-neutral-700 shadow-inner z-10 rounded-sm pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pointer-events-auto">
          {/* Subtle Stance Badge (Crouch / Slide / Prone) only when active */}
        {(stats.isCrouched || stats.isProne || stats.isSliding) && (
          <div className="bg-red-950/90 border border-red-500/60 px-2.5 py-1 rounded-md font-['Chakra_Petch'] text-[10px] font-bold text-red-200 tracking-wider animate-pulse flex items-center gap-1.5 w-max shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping shrink-0" />
            {stats.isSliding ? "TACTICAL SLIDE" : (stats.isProne ? "PRONE" : "CROUCHED")}
          </div>
        )}

        {/* 18 Hearts Health Display Card */}
        <div className="bg-black/80 backdrop-blur-md border border-neutral-800/90 p-3 rounded-xl w-68 shadow-2xl space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold font-['Chakra_Petch']">
            <span className="text-red-400 flex items-center gap-1.5 tracking-wider">
              <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 animate-pulse" /> 18 HEARTS
            </span>
            <span className={stats.health < 30 ? 'text-red-500 font-extrabold animate-pulse' : 'text-white'}>
              {Math.round(stats.health)}%
            </span>
          </div>

          <div className="text-[9px] text-amber-400/90 font-mono tracking-tight text-left">
            ⏳ SLOTH DRAIN (3 TO 7 HOURS TO DEPLETE)
          </div>

          {/* 18 Hearts Grid (2 rows of 9 hearts) */}
          <div className="grid grid-cols-9 gap-1 pt-0.5 pb-0.5">
            {Array.from({ length: 18 }).map((_, i) => {
              const heartValue = (stats.health / stats.maxHealth) * 18;
              const isFull = heartValue >= i + 0.85;
              const isHalf = heartValue > i + 0.15 && heartValue < i + 0.85;

              return (
                <div key={i} className="flex items-center justify-center">
                  {isFull ? (
                    <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.9)]" />
                  ) : isHalf ? (
                    <Heart className="w-3.5 h-3.5 fill-red-800 text-red-500 opacity-80" />
                  ) : (
                    <Heart className="w-3.5 h-3.5 text-neutral-800 fill-neutral-950" />
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

        {/* Compact Stamina Bar */}
        <div className="flex items-center gap-2.5 bg-black/70 backdrop-blur-md border border-neutral-800/80 px-3 py-2 rounded-xl w-68 shadow-lg">
          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] font-bold font-['Chakra_Petch'] mb-0.5">
              <span className="text-neutral-400">STAMINA</span>
              <span className="text-white">{Math.round(stats.stamina)}%</span>
            </div>
            <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-neutral-800">
              <div 
                className="h-full bg-amber-500 transition-all duration-150"
                style={{ width: `${(stats.stamina / stats.maxStamina) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* 5. DOCKED BOTTOM WEAPONS HOTBAR (AWAY AT THE BOTTOM / SCROLL WHEEL) */}
      {unlockedList.length > 0 && (
        <div 
          onWheel={handleBarWheel}
          className="absolute bottom-18 inset-x-0 mx-auto w-max max-w-[94vw] flex flex-col items-center gap-1 pointer-events-auto z-30"
        >
          {/* Subtle scroll wheel & slot indicator */}
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-neutral-400 bg-black/60 px-3 py-0.5 rounded-full border border-neutral-800/60 backdrop-blur-sm">
            <span>🖱️ SCROLL WHEEL OR 1-0 TO SWITCH</span>
            <span className="text-neutral-600">·</span>
            <span className="text-red-400 font-bold uppercase">{weapon.name}</span>
          </div>

          {/* Clean Horizontal Weapon Slots */}
          <div className="flex items-center gap-1.5 p-1.5 bg-neutral-950/85 backdrop-blur-md border border-neutral-800/80 rounded-xl shadow-2xl overflow-x-auto max-w-full">
            {unlockedList.map((wId, i) => {
              const isActive = weapon.id === wId;
              const meta = WEAPON_META[wId] || { label: wId.toUpperCase(), icon: '🔫', short: wId.toUpperCase() };
              const slotNumber = i + 1 <= 9 ? i + 1 : (i + 1 === 10 ? 0 : i + 1);

              return (
                <button
                  key={wId}
                  onClick={() => onSwitchWeaponSlot?.(i)}
                  className={`group px-2.5 py-1.5 rounded-lg border font-mono text-[11px] font-bold transition-all select-none cursor-pointer flex items-center gap-2 shrink-0 ${
                    isActive 
                      ? 'bg-red-950/90 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] scale-105 ring-1 ring-red-400' 
                      : 'bg-neutral-900/70 border-neutral-800/80 text-neutral-400 hover:text-white hover:border-neutral-600 hover:bg-neutral-800/60'
                  }`}
                  title={`${meta.label} (Press ${slotNumber} or Scroll Wheel)`}
                >
                  <span className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center font-['Chakra_Petch'] ${
                    isActive ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400 group-hover:text-white'
                  }`}>
                    {slotNumber}
                  </span>
                  <span className="text-sm">{meta.icon}</span>
                  <span className="font-['Chakra_Petch'] text-[11px] font-bold tracking-wide whitespace-nowrap">
                    {meta.short}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. BOTTOM RIGHT: SHOOTING BUTTON & RELOAD BUTTON (KEPT WHERE THEY ARE) */}
      <div className="absolute bottom-20 right-8 flex flex-col items-end gap-2.5 pointer-events-auto z-30">
        {/* Compact Ammo Display */}
        <div className="bg-black/70 backdrop-blur-md border border-neutral-800/80 px-4 py-2.5 rounded-xl text-right min-w-[170px] shadow-lg">
          <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest font-['Chakra_Petch'] truncate">
            {weapon.name}
          </div>
          <div className="flex items-baseline justify-end gap-1 font-['Chakra_Petch']">
            <span className={`text-3xl font-extrabold ${weapon.currentAmmo === 0 ? 'text-red-600 animate-pulse' : 'text-white'}`}>
              {weapon.currentAmmo}
            </span>
            <span className="text-base text-neutral-500 font-bold">/ {weapon.totalReserve}</span>
          </div>

          {isReloading && (
            <div className="text-[10px] font-bold text-amber-400 font-mono animate-pulse mt-0.5">
              RELOADING...
            </div>
          )}
        </div>

        {/* Tactical Command Buttons: Reload & Shoot Kept Where They Are */}
        <div className="flex items-center gap-2.5">
          {/* Reload Weapon Button */}
          <button
            onClick={onReload}
            className="px-4 py-3 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/80 hover:border-amber-400 text-amber-400 hover:text-amber-300 rounded-xl font-bold text-xs tracking-wider font-['Chakra_Petch'] flex items-center gap-2 transition-all select-none active:scale-95 shadow-lg cursor-pointer backdrop-blur-sm"
            title="Reload Weapon (Key R)"
          >
            <RotateCw className={`w-4 h-4 ${isReloading ? 'animate-spin' : ''}`} />
            <span>RELOAD</span>
          </button>

          {/* Shoot Weapon Button */}
          <button
            onClick={onShoot}
            className="px-6 py-3.5 bg-red-700 hover:bg-red-600 active:bg-red-800 border border-red-500 rounded-xl font-extrabold text-sm tracking-widest font-['Chakra_Petch'] text-white flex items-center gap-2.5 transition-all active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer"
            title="Shoot Weapon (Left Click / Tap)"
          >
            <Crosshair className="w-5 h-5" />
            <span>SHOOT</span>
          </button>
        </div>
      </div>

      {/* Exit Multiplayer Confirmation Modal */}
      <ExitConfirmationModal
        isOpen={isExitConfirmOpen}
        title="EXIT MULTIPLAYER?"
        message="Are you sure you want to leave this multiplayer co-op match and return to the main menu?"
        onConfirm={() => {
          setIsExitConfirmOpen(false);
          onExitMultiplayer?.();
        }}
        onCancel={() => setIsExitConfirmOpen(false)}
      />

    </div>
  );
};
