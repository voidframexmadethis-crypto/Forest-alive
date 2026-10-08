import React from 'react';
import { PlayerStats } from '../types/game';
import { Skull, Trophy, RotateCcw, Home, Crosshair, Heart, Clock } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface GameOverModalProps {
  victory: boolean;
  stats: PlayerStats;
  onRestart: () => void;
  onReturnMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  victory,
  stats,
  onRestart,
  onReturnMenu
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-6 text-white font-['Plus_Jakarta_Sans'] select-none">
      <div className="max-w-xl w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-8 space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center">
        
        {/* Title Icon */}
        <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center border shadow-xl">
          {victory ? (
            <div className="bg-emerald-950/80 border-emerald-500 text-emerald-400 p-4 rounded-xl">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>
          ) : (
            <div className="bg-red-950/80 border-red-600 text-red-500 p-4 rounded-xl">
              <Skull className="w-10 h-10 animate-pulse" />
            </div>
          )}
        </div>

        <div>
          <h2 className={`text-3xl font-extrabold font-['Chakra_Petch'] tracking-wide ${
            victory ? 'text-emerald-400' : 'text-red-500'
          }`}>
            {victory ? 'EXTRACTION SUCCESSFUL' : 'KILLED IN ACTION'}
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-1">
            {victory ? 'You made it to the extraction plane and escaped the forest nightmare!' : 'The creatures overwhelmed your position in the dark woods.'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 bg-neutral-900/60 border border-neutral-800/80 p-4 rounded-xl text-left font-mono text-xs">
          <div className="flex items-center gap-3">
            <Crosshair className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <div className="text-neutral-400">TOTAL ELIMINATIONS</div>
              <div className="text-base font-bold text-white font-['Chakra_Petch']">{stats.kills}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Crosshair className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-neutral-400">HEADSHOT CRITICALS</div>
              <div className="text-base font-bold text-white font-['Chakra_Petch']">{stats.headshots}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-neutral-400">SURVIVAL DURATION</div>
              <div className="text-base font-bold text-white font-['Chakra_Petch']">
                {Math.floor(stats.survivalSeconds / 60)}m {stats.survivalSeconds % 60}s
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <div className="text-neutral-400">DOUBLE TANK PUNCHED</div>
              <div className="text-base font-bold text-red-400 font-['Chakra_Petch']">
                {stats.coughedBlood ? 'YES (COUGHED BLOOD)' : 'NO'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => { soundEngine.playMechanicalClick(); onRestart(); }}
            className="flex-1 py-3.5 bg-red-700 hover:bg-red-800 text-white font-bold text-sm tracking-wider rounded-xl font-['Chakra_Petch'] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
          >
            <RotateCcw className="w-4 h-4" /> DEPLOY AGAIN
          </button>

          <button
            onClick={() => { soundEngine.playMechanicalClick(); onReturnMenu(); }}
            className="flex-1 py-3.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 font-bold text-sm tracking-wider rounded-xl font-['Chakra_Petch'] transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> MAIN MENU
          </button>
        </div>

      </div>
    </div>
  );
};
