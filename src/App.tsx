import React, { useState, useRef, useEffect } from 'react';
import { Difficulty, ForestType, GameMode, GameState, PlayerStats, Weapon } from './types/game';
import { GameEngine } from './game/engine';
import { WEAPONS_DATABASE } from './game/weapons';
import { MainMenu } from './components/MainMenu';
import { HUD } from './components/HUD';
import { SafehouseUI } from './components/SafehouseUI';
import { CutsceneModal } from './components/CutsceneModal';
import { GameOverModal } from './components/GameOverModal';
import { soundEngine } from './game/audio';
import { SandboxModal, FPSConfig } from './components/SandboxModal';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [mode, setMode] = useState<GameMode>('blood_harvest');
  const [forestType, setForestType] = useState<ForestType>('pine_dark');
  const [difficulty, setDifficulty] = useState<Difficulty>('realism');

  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    isSprinting: false,
    isBreathingHeavy: false,
    isFlashlightOn: false,
    bloodOnScreen: 0,
    greenAcidOnScreen: 0,
    whiteMistOnScreen: 0,
    kills: 0,
    headshots: 0,
    survivalSeconds: 0,
    inTank: false,
    coughedBlood: false,
    isCrouched: false,
    isProne: false,
    isSliding: false,
    isHitmarkerActive: false,
    skinwalkerJumpScareActive: false,
    unlockedWeapons: 'm4a1,smoke_grenade,shotgun,sniper,minigun,grenade'
  });

  const [currentWeapon, setCurrentWeapon] = useState<Weapon>({ ...WEAPONS_DATABASE.m4a1 });
  const [gameEvent, setGameEvent] = useState<string>('');
  const [isAiming, setIsAiming] = useState<boolean>(false);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);

  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(false);
  const [fpsConfig, setFpsConfig] = useState<FPSConfig>({
    mouseSensitivity: 0.0022,
    baseSpeed: 6.0,
    sprintMultiplier: 1.7,
    accelerationDamping: 10.0,
    decelerationDamping: 10.0,
    gravity: 24.5,
    jumpForce: 7.5,
    bobFrequency: 8.0,
    bobAmplitudeX: 0.03,
    bobAmplitudeY: 0.05,
    sprintBobMultiplier: 1.625,
    crouchSpeed: 2.8,
    proneSpeed: 1.5,
    cameraRollWeight: 0.008
  });

  const [cutsceneType, setCutsceneType] = useState<'weapon_prep' | 'tank_escape'>('weapon_prep');

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Initialize sound on user key/mouse
  useEffect(() => {
    const handleInteract = () => {
      soundEngine.init();
    };
    window.addEventListener('click', handleInteract);
    window.addEventListener('keydown', handleInteract);
    return () => {
      window.removeEventListener('click', handleInteract);
      window.removeEventListener('keydown', handleInteract);
    };
  }, []);

  const handleStartGame = (selectedMode: GameMode, selectedForest: ForestType, selectedDifficulty: Difficulty) => {
    setMode(selectedMode);
    setForestType(selectedForest);
    setDifficulty(selectedDifficulty);
    setCutsceneType('weapon_prep');
    setGameState('intro_cutscene');
  };

  const handleCutsceneComplete = () => {
    if (cutsceneType === 'weapon_prep') {
      setGameState('playing');
      setTimeout(() => {
        initGameEngine();
      }, 50);
    } else {
      setGameState('victory');
    }
  };

  const initGameEngine = () => {
    if (!canvasContainerRef.current) return;

    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }

    engineRef.current = new GameEngine(
      canvasContainerRef.current,
      mode,
      forestType,
      {
        onStatsChange: (s) => setPlayerStats({ ...s }),
        onWeaponChange: (w) => setCurrentWeapon({ ...w }),
        onGameEvent: (msg) => {
          setGameEvent(msg);
          setTimeout(() => setGameEvent(''), 4000);
        },
        onGameOver: (victory) => {
          setIsVictory(victory);
          setGameState(victory ? 'victory' : 'game_over');
        },
        onEnterSafehouseRest: () => {
          setGameState('safehouse_rest');
        }
      }
    );

    // Synchronize initial customized physics parameters
    engineRef.current.updateConfig(fpsConfig);
  };

  const handleSandboxConfigChange = (newConfig: Partial<FPSConfig>) => {
    setFpsConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      if (engineRef.current) {
        engineRef.current.updateConfig(updated);
      }
      return updated;
    });
  };

  const handleOpenSandbox = () => {
    soundEngine.playMechanicalClick(0.5, 1200);
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    setIsSandboxOpen(true);
  };

  const handleCloseSandbox = () => {
    soundEngine.playMechanicalClick(0.5, 1000);
    setIsSandboxOpen(false);
    setTimeout(() => {
      canvasContainerRef.current?.requestPointerLock();
    }, 150);
  };

  const handleReload = () => {
    if (engineRef.current) {
      engineRef.current.reload();
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
    setGameState('playing');
    setTimeout(() => {
      initGameEngine();
    }, 50);
  };

  const handleReturnMenu = () => {
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
    setGameState('menu');
  };

  // Safehouse telescope window sniper slot mode
  const handleEnterTelescopeMode = () => {
    setGameState('playing');
    if (engineRef.current) {
      engineRef.current.isTelescopeMode = true;
      engineRef.current.reload();
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-['Plus_Jakarta_Sans']">
      
      {/* 1. MAIN MENU */}
      {gameState === 'menu' && (
        <MainMenu onStartGame={handleStartGame} />
      )}

      {/* 2. INTRO OR EXTRACTION CUTSCENES */}
      {(gameState === 'intro_cutscene' || gameState === 'escape_cutscene') && (
        <CutsceneModal 
          type={cutsceneType} 
          onComplete={handleCutsceneComplete} 
        />
      )}

      {/* 3. 3D GAME CANVAS CONTAINER */}
      <div 
        ref={canvasContainerRef} 
        className={`w-full h-full ${gameState === 'playing' ? 'block' : 'hidden'}`}
      />

      {/* 4. GAMEPLAY HUD */}
      {gameState === 'playing' && engineRef.current && (
        <HUD 
          stats={playerStats}
          weapon={currentWeapon}
          gameEvent={gameEvent}
          isAiming={engineRef.current.isAiming}
          isReloading={engineRef.current.isReloading}
          isLocked={engineRef.current.isLocked}
          onReload={() => engineRef.current?.triggerReload()}
          onShoot={() => engineRef.current?.triggerShoot()}
          onSwitchWeaponSlot={(idx) => engineRef.current?.switchWeapon(idx)}
          onMoveForward={(val) => engineRef.current?.setMoveForward(val)}
          onMoveBackward={(val) => engineRef.current?.setMoveBackward(val)}
          onMoveLeft={(val) => engineRef.current?.setMoveLeft(val)}
          onMoveRight={(val) => engineRef.current?.setMoveRight(val)}
          onUnlockPointer={() => canvasContainerRef.current?.requestPointerLock()}
          onOpenSandbox={handleOpenSandbox}
        />
      )}

      {/* 4.5 LIVE PHYSICS AND CODE VIEW SANDBOX */}
      {isSandboxOpen && (
        <SandboxModal 
          config={fpsConfig}
          onChange={handleSandboxConfigChange}
          onClose={handleCloseSandbox}
        />
      )}

      {/* 5. SAFEHOUSE INTERIOR REST UI */}
      {gameState === 'safehouse_rest' && (
        <SafehouseUI 
          onExitSafehouse={() => setGameState('playing')}
          onTriggerWeaponPrepCutscene={() => {
            setCutsceneType('weapon_prep');
            setGameState('intro_cutscene');
          }}
          onEnterTelescopeMode={handleEnterTelescopeMode}
        />
      )}

      {/* 6. GAME OVER OR VICTORY MODAL */}
      {(gameState === 'game_over' || gameState === 'victory') && (
        <GameOverModal 
          victory={isVictory || gameState === 'victory'}
          stats={playerStats}
          onRestart={handleRestart}
          onReturnMenu={handleReturnMenu}
        />
      )}

    </div>
  );
}
