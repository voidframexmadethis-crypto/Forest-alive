import React, { useEffect, useState } from 'react';
import { ShieldAlert, Crosshair, Play, Plane, Flame, Heart, Users, Sparkles, Home, Shield, Volume2, SkipForward } from 'lucide-react';
import { soundEngine } from '../game/audio';

export type CutsceneStoryType = 
  | 'weapon_prep' 
  | 'tank_escape' 
  | 'titan_intro' 
  | 'katrina_intro' 
  | 'natasha_intro' 
  | 'luis_intro' 
  | 'bill_intro' 
  | 'the_outbreak' 
  | 'survivor_meeting';

interface CutsceneProps {
  type: CutsceneStoryType;
  onComplete: () => void;
}

export const CUTSCENE_METADATA: Record<CutsceneStoryType, {
  title: string;
  subtitle: string;
  steps: { title: string; desc: string; icon: string; soundCue: string }[];
}> = {
  weapon_prep: {
    title: 'TACTICAL WEAPON PREPARATION SEQUENCE',
    subtitle: 'Inspecting loadouts before stepping out into the dark pine forest.',
    steps: [
      { title: 'INSPECTING TACTICAL LOADOUT', desc: 'Checking barrel geometry, optical red-dot alignment, and chambering 5.56mm NATO rounds...', icon: 'crosshair', soundCue: 'click' },
      { title: 'RACKING BOLT & CHECKING MAGS', desc: 'Extended magazines seated. Flashlight battery verified at 100% output.', icon: 'shield', soundCue: 'reload' },
      { title: 'UNLOCKING HEAVY STEEL SAFEHOUSE DOOR', desc: 'Stepping out into the dark fog. Prepare to face the hordes!', icon: 'play', soundCue: 'footstep' }
    ]
  },
  tank_escape: {
    title: 'TANK / PLANE EXTRACTION ESCAPE',
    subtitle: 'Heavy armored breakthrough and aerial evacuation.',
    steps: [
      { title: 'BOARDING HEAVY ARMORED MILITARY TANK', desc: 'Sealing heavy hatch doors as Double Tanks and Skinwalkers pound against the armor!', icon: 'plane', soundCue: 'rumble' },
      { title: 'DIESEL TURBO ENGINE RUMBLING TO LIFE', desc: 'Tank treads crushing undead hordes beneath as cannon fires continuous suppressive shells!', icon: 'flame', soundCue: 'engine' },
      { title: 'REACHED AIRFIELD EXTRACTION PLANE', desc: 'Flying to safety above the infested forest canopy! VICTORY ACHIEVED!', icon: 'play', soundCue: 'victory' }
    ]
  },
  titan_intro: {
    title: 'TITAN: THE VETERAN RETURNS HOME',
    subtitle: 'Former Army serviceman returning to his family after grueling overseas deployment.',
    steps: [
      { title: 'MILITARY DISCHARGE & TRAIN RIDE', desc: 'Titan gazes out the window at the familiar mountain peaks. After years of service, he is finally coming home to his wife and three children—with a fourth on the way.', icon: 'shield', soundCue: 'click' },
      { title: 'WARMING FAMILY REUNION', desc: 'Stepping up to the porch, his children rush into his arms in joyous laughter while his loving wife smiles from the doorway, resting her hand on her pregnant belly.', icon: 'heart', soundCue: 'reload' },
      { title: 'THE CALM BEFORE THE STORM', desc: 'Night falls over the peaceful valley. Titan cleans his tactical gear by the fireplace, unaware that the dark fog is creeping toward their property line.', icon: 'flame', soundCue: 'footstep' }
    ]
  },
  katrina_intro: {
    title: 'KATRINA: THE EXPECTING MOTHER',
    subtitle: 'A devoted mother of two, days away from giving birth to her third child.',
    steps: [
      { title: 'PEACEFUL HOME IN THE PINE VALLEY', desc: 'Katrina tends to her two young children in their warm cottage. Heavily pregnant with her third child, she feels the first distant tremors of the approaching outbreak.', icon: 'home', soundCue: 'click' },
      { title: 'THE DISTANT SIRENS', desc: 'Emergency broadcast alerts crackle over the radio. Government lines go dead as military convoys speed northward past the valley.', icon: 'shield', soundCue: 'reload' },
      { title: 'PREPARING FOR RECON', desc: 'Knowing trouble is coming, Katrina secures provisions and locks the shutters, determined to protect her children against whatever roams the dark woods.', icon: 'crosshair', soundCue: 'footstep' }
    ]
  },
  natasha_intro: {
    title: 'NATASHA: THE ESTATE HEIRESS',
    subtitle: 'Living in a sprawling secluded mansion, expecting her first child in luxury.',
    steps: [
      { title: 'THE LUXURIOUS MOUNTAIN ESTATE', desc: 'Natasha overlooks the foggy forest canopy from the balcony of her grand manor. Expecting her first child, she enjoys absolute wealth and security.', icon: 'sparkles', soundCue: 'click' },
      { title: 'POWER OUTAGE AT THE GATES', desc: 'Security cameras flicker and die. Distant unearthly screeches echo across the wrought-iron perimeter fence as guard dogs panic.', icon: 'shield', soundCue: 'rumble' },
      { title: 'ABANDONING LUXURY FOR SURVIVAL', desc: 'With the front gates breached by grotesque creatures, Natasha grabs a family heirloom revolver and flees into the freezing night toward the safehouse valley.', icon: 'flame', soundCue: 'footstep' }
    ]
  },
  luis_intro: {
    title: 'LUIS: THE COMBAT MECHANIC',
    subtitle: 'Hardened field engineer and vehicle specialist in his home garage workshop.',
    steps: [
      { title: 'WELDING TANK ARMOR', desc: 'Luis works late in his garage, welding steel reinforcement plates onto a military jeep engine while his family sleeps upstairs.', icon: 'home', soundCue: 'click' },
      { title: 'RADIO DISTRESS CALLS', desc: 'Static bursts over the workshop bench radio. A military commander begs for engineering support before the transmission cuts into dead silence.', icon: 'shield', soundCue: 'reload' },
      { title: 'ARMING THE WORKSHOP', desc: 'Luis barricades the garage doors with industrial tool racks and readies his wrench and shotgun as heavy footfalls thump on the roof.', icon: 'crosshair', soundCue: 'footstep' }
    ]
  },
  bill_intro: {
    title: 'BILL: THE WILDERNESS MARKSMAN',
    subtitle: 'Seasoned mountain hunter and long-range survival expert in his timber cabin.',
    steps: [
      { title: 'SCOUTING THE RIDGE', desc: 'Bill cleans his bolt-action sniper rifle inside his remote cabin, watching wildlife flee down the mountain in unnatural terror.', icon: 'crosshair', soundCue: 'click' },
      { title: 'THE CORRUPTED CREATURES', desc: 'Through his high-power scope, Bill spots towering silhouettes and skinwalkers moving between the pines with unnatural speed.', icon: 'shield', soundCue: 'reload' },
      { title: 'LOCKING THE CABIN', desc: 'Bill loads his bandolier and lights kerosene lanterns, knowing the mountains have become a hunting ground.', icon: 'flame', soundCue: 'footstep' }
    ]
  },
  the_outbreak: {
    title: 'THE OUTBREAK: PANDEMIC ZERO',
    subtitle: 'The night the peaceful valley fell to darkness and unearthly contagion.',
    steps: [
      { title: 'THE RED MIST DESCENDS', desc: 'An unnatural crimson fog rolls over the horizon, turning the starry night sky into an oppressive blood-red canopy.', icon: 'flame', soundCue: 'rumble' },
      { title: 'CITY IN CHAOS', desc: 'Emergency sirens wail across towns and settlements as military checkpoints are overrun by hordes of screaming hostiles and towering double tanks.', icon: 'shieldAlert', soundCue: 'reload' },
      { title: 'THE STRUGGLE FOR SURVIVAL', desc: 'Families scatter into the woods as communication networks collapse. The survivors must unite or perish in the dark.', icon: 'users', soundCue: 'footstep' }
    ]
  },
  survivor_meeting: {
    title: 'THE SURVIVORS: ALLIANCE AT THE SAFEHOUSE',
    subtitle: 'Titan, Katrina, Natasha, Luis, and Bill converge at the fortified valley safehouse.',
    steps: [
      { title: 'GATHERING AROUND THE WAR MAP', desc: 'Displaced by the carnage, the survivors converge at the underground safehouse bunker. Titan takes tactical command of the group.', icon: 'users', soundCue: 'click' },
      { title: 'COMBINING ARSENALS & SKILLS', desc: 'Luis reinforces the steel doors, Bill establishes sniper overwatch at the windows, and Natasha and Katrina organize medical triage.', icon: 'shield', soundCue: 'reload' },
      { title: 'MARCHING INTO THE HORDE', desc: 'United as one unbreakable squad, the survivors step out into the mist to reclaim their home and fight back against the dark forces.', icon: 'play', soundCue: 'victory' }
    ]
  }
};

export const CutsceneModal: React.FC<CutsceneProps> = ({ type, onComplete }) => {
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [holdTimer, setHoldTimer] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);

  const currentCutscene = CUTSCENE_METADATA[type] || CUTSCENE_METADATA.weapon_prep;
  const totalSteps = currentCutscene.steps.length;

  // Progression timers for each step
  useEffect(() => {
    soundEngine.playMechanicalClick(0.8, 800);

    const stepDuration = 3000; // 3 seconds per step
    const timers: NodeJS.Timeout[] = [];

    for (let i = 1; i < totalSteps; i++) {
      const t = setTimeout(() => {
        setStepIdx(i);
        soundEngine.playReloadSound();
      }, stepDuration * i);
      timers.push(t);
    }

    const finalTimer = setTimeout(() => {
      onComplete();
    }, stepDuration * totalSteps + 500);
    timers.push(finalTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [type, totalSteps, onComplete]);

  // Keyboard skip listeners
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

  // RequestAnimationFrame ticker for progressive skip meter
  useEffect(() => {
    let animationFrameId: number;
    const requiredHoldTime = 1000; // 1 second
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
        setHoldTimer((prev) => Math.max(0, prev - delta * 2.5));
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

  const currentStepData = currentCutscene.steps[stepIdx] || currentCutscene.steps[0];

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-between p-6 md:p-12 select-none font-['Plus_Jakarta_Sans']">
      
      {/* Top Banner */}
      <div className="w-full flex justify-between items-center border-b border-red-900/40 pb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Flame className="w-5 h-5 text-red-500 animate-pulse shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold font-['Chakra_Petch'] text-red-500 tracking-wider block truncate">
              {currentCutscene.title}
            </span>
            <span className="text-[9px] text-neutral-400 font-mono hidden xs:block truncate">
              {currentCutscene.subtitle}
            </span>
          </div>
        </div>

        {/* Hold-to-Skip AAA Progress widget */}
        <div className="flex items-center gap-2 bg-neutral-950/90 border border-neutral-800 p-1.5 rounded-xl shadow-lg shrink-0 scale-90 xs:scale-100">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-8 h-8 transform -rotate-90">
              <circle cx="16" cy="16" r={14} stroke="#1f1f1f" strokeWidth="3" fill="transparent" />
              <circle
                cx="16"
                cy="16"
                r={14}
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
            <div className="text-[8px] font-bold font-['Chakra_Petch'] text-neutral-400 uppercase leading-none">Hold Space</div>
            <div className="text-[9px] font-extrabold font-['Chakra_Petch'] text-white tracking-wide">SKIP</div>
          </div>
        </div>
      </div>

      {/* Cinematic Central Display */}
      <div className="my-auto max-w-3xl text-center space-y-6">
        <div className="w-24 h-24 bg-neutral-900/90 border border-red-600/40 rounded-3xl mx-auto flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(220,38,38,0.3)] animate-pulse">
          {currentStepData.icon === 'shield' && <Shield className="w-12 h-12" />}
          {currentStepData.icon === 'heart' && <Heart className="w-12 h-12 text-pink-500" />}
          {currentStepData.icon === 'flame' && <Flame className="w-12 h-12 text-amber-500" />}
          {currentStepData.icon === 'home' && <Home className="w-12 h-12 text-emerald-400" />}
          {currentStepData.icon === 'sparkles' && <Sparkles className="w-12 h-12 text-amber-300" />}
          {currentStepData.icon === 'crosshair' && <Crosshair className="w-12 h-12" />}
          {currentStepData.icon === 'shieldAlert' && <ShieldAlert className="w-12 h-12 text-red-500" />}
          {currentStepData.icon === 'users' && <Users className="w-12 h-12 text-blue-400" />}
          {currentStepData.icon === 'plane' && <Plane className="w-12 h-12 text-cyan-400" />}
          {currentStepData.icon === 'play' && <Play className="w-12 h-12 fill-red-500" />}
        </div>

        <div className="space-y-3">
          <span className="text-xs font-mono text-red-400 font-bold tracking-widest uppercase bg-red-950/60 border border-red-800/40 px-3 py-1 rounded-full">
            CHAPTER {stepIdx + 1} OF {totalSteps}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold font-['Chakra_Petch'] text-white tracking-wide">
            {currentStepData.title}
          </h2>
          <p className="text-base text-neutral-300 font-sans max-w-2xl mx-auto leading-relaxed">
            {currentStepData.desc}
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 pt-4">
          {currentCutscene.steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === stepIdx ? 'w-10 bg-red-500' : 'w-3 bg-neutral-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Footer Controls & Skip */}
      <div className="w-full flex justify-between items-center border-t border-neutral-900 pt-4 text-xs text-neutral-500 font-mono">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-neutral-400" />
          <span>CINEMATIC AUDIO & ATMOSPHERE ACTIVE</span>
        </div>
        <button
          onClick={onComplete}
          className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white rounded-xl font-bold font-['Chakra_Petch'] tracking-wider transition-all cursor-pointer"
        >
          SKIP / PROCEED →
        </button>
      </div>

    </div>
  );
};
