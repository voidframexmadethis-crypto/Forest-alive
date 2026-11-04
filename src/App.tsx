import React, { useState, useRef, useEffect } from 'react';
import { Difficulty, ForestType, GameMode, GameState, PlayerStats, Weapon } from './types/game';
import { GameEngine } from './game/engine';
import { WEAPONS_DATABASE } from './game/weapons';
import { MainMenu } from './components/MainMenu';
import { HUD } from './components/HUD';
import { SafehouseUI } from './components/SafehouseUI';
import { CutsceneModal, CutsceneStoryType } from './components/CutsceneModal';
import { OpeningCinematicModal } from './components/OpeningCinematicModal';
import { GameOverModal } from './components/GameOverModal';
import { soundEngine } from './game/audio';
import { SandboxModal, FPSConfig } from './components/SandboxModal';
import { MultiplayerLobbyModal } from './components/MultiplayerLobbyModal';
import { MultiplayerRoom } from './types/multiplayer';
import { HumanCharacterId } from './game/characterMesh';
import { networkClient } from './game/multiplayer/NetworkClient';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const seen = localStorage.getItem('forest_alive_seen_opening');
    return seen ? 'menu' : 'opening_cinematic';
  });
  const [mode, setMode] = useState<GameMode>('blood_harvest');
  const [forestType, setForestType] = useState<ForestType>('pine_dark');
  const [difficulty, setDifficulty] = useState<Difficulty>('realism');
  const [singlePlayerCharacter, setSinglePlayerCharacter] = useState<HumanCharacterId>('titan');

  // Multiplayer State
  const [isMultiplayerLobbyOpen, setIsMultiplayerLobbyOpen] = useState<boolean>(false);
  const [isMultiplayerActive, setIsMultiplayerActive] = useState<boolean>(false);
  const [multiplayerRoom, setMultiplayerRoom] = useState<MultiplayerRoom | null>(null);
  const [multiplayerLocalId, setMultiplayerLocalId] = useState<string | null>(null);

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

  const [cutsceneType, setCutsceneType] = useState<CutsceneStoryType>('weapon_prep');
  const [isMenuCinematic, setIsMenuCinematic] = useState<boolean>(false);

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

  useEffect(() => {
    networkClient.setListeners({
      onRoomUpdate: (room) => setMultiplayerRoom(room),
      // @ts-ignore
      onStoryEventTriggered: (msg: any) => {
        if (msg.event === 'katrina_labor') {
          setCutsceneType('katrina_labor_event');
          setGameState('intro_cutscene');
        } else if (msg.event === 'campaign_complete') {
          setGameState('campaign_complete');
        }
      }
    });
  }, []);

  const handleStartGame = (selectedMode: GameMode, selectedForest: ForestType, selectedDifficulty: Difficulty) => {
    setMode(selectedMode);
    setForestType(selectedForest);
    setDifficulty(selectedDifficulty);

    // Check once-per-save storage for titan intro
    const hasSeenTitanIntro = localStorage.getItem('forest_alive_seen_titan_intro');
    if (!hasSeenTitanIntro) {
      localStorage.setItem('forest_alive_seen_titan_intro', 'true');
      setCutsceneType('titan_intro');
      setIsMenuCinematic(false);
    } else {
      setCutsceneType('weapon_prep');
      setIsMenuCinematic(false);
    }
    setGameState('intro_cutscene');
  };

  const handleWatchCinematic = (type: CutsceneStoryType) => {
    setCutsceneType(type);
    setIsMenuCinematic(true);
    setGameState('intro_cutscene');
  };

  const handleOpeningCinematicComplete = () => {
    localStorage.setItem('forest_alive_seen_opening', 'true');
    setGameState('menu');
  };

  const handleReplayOpeningCinematic = () => {
    setGameState('opening_cinematic');
  };

  const handleCutsceneComplete = () => {
    if (isMenuCinematic) {
      setGameState('menu');
      return;
    }

    if (cutsceneType === 'titan_intro') {
      // Transition from Titan Intro to Weapon Prep
      setCutsceneType('weapon_prep');
      setGameState('intro_cutscene');
    } else if (cutsceneType === 'weapon_prep') {
      setGameState('playing');
      setTimeout(() => {
        initGameEngine();
      }, 50);
    } else {
      setGameState('victory');
    }
  };

  const handleOpenMultiplayer = () => {
    setIsMultiplayerLobbyOpen(true);
  };

  const handleCloseMultiplayerLobby = () => {
    setIsMultiplayerLobbyOpen(false);
  };

  const handleStartMultiplayerGame = (room: MultiplayerRoom, localId: string) => {
    setIsMultiplayerLobbyOpen(false);
    setIsMultiplayerActive(true);
    setMultiplayerRoom(room);
    setMultiplayerLocalId(localId);
    setMode(room.mode);
    setForestType(room.forestType);
    setDifficulty(room.difficulty);
    setGameState('playing');
    setTimeout(() => {
      initGameEngine({ isMultiplayer: true, room, localId });
    }, 50);
  };

  const initGameEngine = (options?: { isMultiplayer?: boolean; room?: MultiplayerRoom | null; localId?: string | null }) => {
    if (!canvasContainerRef.current) return;

    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }

    const isMulti = options?.isMultiplayer || false;
    const room = options?.room || multiplayerRoom;
    const localId = options?.localId || multiplayerLocalId;
    const selectedChar = (room && localId && room.players[localId]?.characterId) || 'titan';

    engineRef.current = new GameEngine(
      canvasContainerRef.current,
      room ? room.mode : mode,
      room ? room.forestType : forestType,
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
      },
      {
        isMultiplayer: isMulti,
        multiplayerRoom: room,
        localPlayerId: localId,
        selectedCharacter: isMulti ? (selectedChar as HumanCharacterId) : singlePlayerCharacter
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
      initGameEngine({ isMultiplayer: isMultiplayerActive, room: multiplayerRoom, localId: multiplayerLocalId });
    }, 50);
  };

  const handleReturnMenu = () => {
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
    if (isMultiplayerActive) {
      networkClient.leaveRoom();
      setIsMultiplayerActive(false);
      setMultiplayerRoom(null);
      setMultiplayerLocalId(null);
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
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      {/* Orientation Lock Guard for Mobile */}
      <div className="orientation-guard">
        <div className="max-w-xs space-y-4">
          <div className="w-16 h-16 bg-red-600/20 border border-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-500 font-['Chakra_Petch'] tracking-tighter">PORTRAIT MODE REQUIRED</h1>
          <p className="text-neutral-400 font-mono text-[10px] uppercase tracking-widest leading-relaxed">
            Forest Alive is optimized for long-screen phone displays. Please rotate your device to portrait to continue survival operations.
          </p>
        </div>
      </div>
      
      <div className="portrait-frame w-full h-full shadow-[0_0_100px_rgba(0,0,0,1)]">
      
      {/* 0. OPENING CINEMATIC MOVIE */}
      {gameState === 'opening_cinematic' && (
        <OpeningCinematicModal onComplete={handleOpeningCinematicComplete} />
      )}

      {/* 1. MAIN MENU */}
      {gameState === 'menu' && (
        <MainMenu 
          onStartGame={handleStartGame} 
          onWatchCinematic={handleWatchCinematic} 
          onReplayOpening={handleReplayOpeningCinematic}
          onOpenMultiplayer={handleOpenMultiplayer}
          selectedCharacter={singlePlayerCharacter}
          onSelectCharacter={setSinglePlayerCharacter}
        />
      )}

      {/* 1.5 COOPERATIVE MULTIPLAYER LOBBY MODAL */}
      {isMultiplayerLobbyOpen && (
        <MultiplayerLobbyModal 
          onClose={handleCloseMultiplayerLobby}
          onStartMultiplayerGame={handleStartMultiplayerGame}
          onPlayCinematic={() => handleWatchCinematic('titan_intro')}
        />
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
          isMultiplayer={isMultiplayerActive}
          downedTeammateName={engineRef.current?.getNearbyDownedTeammate()?.name || null}
          onRevive={() => engineRef.current?.interact()}
          onLeaveMultiplayer={handleReturnMenu}
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
    </div>
  );
}
