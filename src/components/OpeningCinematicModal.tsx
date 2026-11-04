import React, { useEffect, useState } from 'react';
import { Shield, Heart, Sparkles, Home, Crosshair, ShieldAlert, Users, Play, Flame, Volume2, SkipForward, Film } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface OpeningCinematicProps {
  onComplete: () => void;
}

export interface CinematicAct {
  actNumber: number;
  title: string;
  subtitle: string;
  description: string;
  characterName?: string;
  icon: any;
  accentColor: string;
  durationMs: number;
}

const CINEMATIC_ACTS: CinematicAct[] = [
  {
    actNumber: 1,
    title: 'THE PEACEFUL VALLEY & CITY SKYLINE',
    subtitle: 'ACT I: BEFORE THE CONTAGION',
    description: 'A wide panoramic establishing shot over the evergreen mountain valley and quiet riverside town. For generations, this sanctuary stood untouched by the chaos of the outside world.',
    icon: Flame,
    accentColor: 'text-amber-400 border-amber-600/50 bg-amber-950/40',
    durationMs: 4500
  },
  {
    actNumber: 2,
    title: 'TITAN: THE VETERAN RETURNS HOME',
    subtitle: 'ACT II: THE SOLDIER\'S REUNION',
    description: 'Titan steps off the late train after grueling overseas deployment. Returning to his wife and three children—with a fourth on the way—he embraces his family on the porch, unaware of the approaching darkness.',
    characterName: 'TITAN (Lead Tactical Operative)',
    icon: Shield,
    accentColor: 'text-red-500 border-red-600/50 bg-red-950/40',
    durationMs: 5000
  },
  {
    actNumber: 3,
    title: 'THE SURVIVORS IN THEIR HOMES',
    subtitle: 'ACT III: LIVES BEFORE THE STORM',
    description: 'Across the valley: Katrina tends to her two children while expecting her third; Natasha oversees her secluded mountain estate; Luis welds jeep armor in his workshop; Bill scopes the timber ridge.',
    characterName: 'KATRINA, NATASHA, LUIS & BILL',
    icon: Heart,
    accentColor: 'text-pink-400 border-pink-600/50 bg-pink-950/40',
    durationMs: 5500
  },
  {
    actNumber: 4,
    title: 'PANDEMIC ZERO: THE RED MIST DESCENDS',
    subtitle: 'ACT IV: THE OUTBREAK BEGINS',
    description: 'Without warning, the night sky turns an oppressive blood-red. Emergency broadcast sirens wail across settlements as communication lines collapse into dead static.',
    icon: ShieldAlert,
    accentColor: 'text-red-600 border-red-600/60 bg-red-950/60',
    durationMs: 5000
  },
  {
    actNumber: 5,
    title: 'CREEPING SUSPENSE & INVASION',
    subtitle: 'ACT V: THE SHADOWS MOVE',
    description: 'Towering silhouettes, double tanks, and skinwalkers stalk the pine tree line. Families bar their doors and windows as unearthly screeches echo through the freezing night.',
    icon: Crosshair,
    accentColor: 'text-amber-500 border-amber-600/50 bg-amber-950/40',
    durationMs: 5000
  },
  {
    actNumber: 6,
    title: 'CONVERGENCE AT THE SAFEHOUSE',
    subtitle: 'ACT VI: THE ALLIANCE FORMS',
    description: 'Displaced by the carnage, Titan, Katrina, Natasha, Luis, and Bill converge at the underground fortified bunker. Individual stories merge into one shared survival saga.',
    characterName: 'THE UNIFIED SQUAD',
    icon: Users,
    accentColor: 'text-blue-400 border-blue-600/50 bg-blue-950/40',
    durationMs: 5000
  },
  {
    actNumber: 7,
    title: 'FINAL SCENE: STANDING UNITED',
    subtitle: 'ACT VII: THE HEROES OF FOREST ALIVE',
    description: 'All five survivors stand side-by-side on the fortification ramparts, weapons locked and loaded, facing down the endless horde streaming from the red mist.',
    characterName: 'ALL SURVIVORS ASSEMBLED',
    icon: Play,
    accentColor: 'text-emerald-400 border-emerald-600/50 bg-emerald-950/40',
    durationMs: 5500
  },
  {
    actNumber: 8,
    title: 'FOREST ALIVE',
    subtitle: 'OPEN-WORLD 3D SURVIVAL ACTION GAME',
    description: 'Prepare for supreme horror survival, vehicle combat, and Call of Duty-grade ballistics.',
    icon: Film,
    accentColor: 'text-red-500 border-red-600 bg-red-950',
    durationMs: 4000
  }
];

export const OpeningCinematicModal: React.FC<OpeningCinematicProps> = ({ onComplete }) => {
  const [currentActIdx, setCurrentActIdx] = useState<number>(0);
  const [holdTimer, setHoldTimer] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);

  const currentAct = CINEMATIC_ACTS[currentActIdx];
  const IconComponent = currentAct.icon;

  // Act Progression Timer
  useEffect(() => {
    soundEngine.playMechanicalClick(0.7, 900);

    const timer = setTimeout(() => {
      if (currentActIdx < CINEMATIC_ACTS.length - 1) {
        setCurrentActIdx((prev) => prev + 1);
        soundEngine.playReloadSound();
      } else {
        onComplete();
      }
    }, currentAct.durationMs);

    return () => clearTimeout(timer);
  }, [currentActIdx, currentAct.durationMs, onComplete]);

  // Skip keyboard listeners
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

  // Progressive skip circle ticker
  useEffect(() => {
    let animationFrameId: number;
    const requiredHoldTime = 1000;
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
        setHoldTimer((prev) => Math.max(0, prev - delta * 3.0));
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHolding, onComplete]);

  const progressPct = holdTimer / 1000;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressPct * circumference;

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-between p-8 md:p-14 select-none font-['Plus_Jakarta_Sans'] overflow-hidden">
      
      {/* Background Cinematic Lighting & Scanlines */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-neutral-950/80 to-black pointer-events-none" />
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Top Navigation & Skip Widget */}
      <div className="relative z-10 w-full flex justify-between items-center border-b border-red-900/30 pb-4 gap-2">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-red-500 animate-pulse shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold font-['Chakra_Petch'] text-red-500 tracking-widest block truncate">
              FOREST ALIVE · OPENING MOVIE
            </span>
            <span className="text-[9px] text-neutral-400 font-mono hidden xs:block">
              DIRECTOR'S CUT SURVIVAL EPIC
            </span>
          </div>
        </div>

        {/* Skip Progress */}
        <div className="flex items-center gap-2 bg-neutral-950/90 border border-neutral-800 p-1.5 rounded-xl shadow-lg shrink-0 scale-90 xs:scale-100">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-8 h-8 transform -rotate-90">
              <circle cx="16" cy="16" r="14" stroke="#1f1f1f" strokeWidth="3" fill="transparent" />
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="#ef4444"
                strokeWidth="3"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 14}
                strokeDashoffset={2 * Math.PI * 14 - (holdTimer / 1000) * 2 * Math.PI * 14}
                strokeLinecap="round"
                className="transition-all duration-75 ease-out"
              />
            </svg>
            <span className="absolute text-[8px] font-bold text-red-500 font-mono">
              {Math.round(progressPct * 100)}%
            </span>
          </div>

          <div className="text-left hidden xs:block">
            <div className="text-[8px] font-bold font-['Chakra_Petch'] text-neutral-400 uppercase">Hold [Space]</div>
            <div className="text-[9px] font-extrabold font-['Chakra_Petch'] text-white tracking-wide">SKIP</div>
          </div>
        </div>
      </div>

      {/* Central Cinematic Scene Display */}
      <div className="relative z-10 my-auto max-w-4xl text-center space-y-6 animate-fade-in">
        <div className={`w-28 h-28 border rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(220,38,38,0.3)] animate-pulse ${currentAct.accentColor}`}>
          <IconComponent className="w-14 h-14" />
        </div>

        <div className="space-y-3">
          <span className="text-xs font-mono text-red-400 font-bold tracking-widest uppercase bg-red-950/80 border border-red-800/50 px-3.5 py-1.5 rounded-full inline-block">
            {currentAct.subtitle}
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold font-['Chakra_Petch'] text-white tracking-wider">
            {currentAct.title}
          </h1>

          {currentAct.characterName && (
            <div className="text-xs font-bold text-amber-400 font-mono tracking-widest uppercase">
              FEATURED: {currentAct.characterName}
            </div>
          )}

          <p className="text-base md:text-lg text-neutral-300 font-sans max-w-2xl mx-auto leading-relaxed pt-2">
            {currentAct.description}
          </p>
        </div>

        {/* Act Progress Dots */}
        <div className="flex justify-center gap-2 pt-6">
          {CINEMATIC_ACTS.map((act, idx) => (
            <div
              key={act.actNumber}
              className={`h-2 rounded-full transition-all duration-500 ${
                idx === currentActIdx ? 'w-12 bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.8)]' : 'w-3 bg-neutral-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="relative z-10 w-full flex justify-between items-center border-t border-neutral-900 pt-4 text-xs text-neutral-500 font-mono">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-neutral-400 animate-pulse" />
          <span>REAL-TIME IN-ENGINE CINEMATIC RENDERING</span>
        </div>
        <button
          onClick={onComplete}
          className="px-8 py-2.5 bg-red-700 hover:bg-red-600 border border-red-500 text-white rounded-xl font-bold font-['Chakra_Petch'] tracking-widest transition-all cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]"
        >
          PROCEED TO MENU →
        </button>
      </div>

    </div>
  );
};
