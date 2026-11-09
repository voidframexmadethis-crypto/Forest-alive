import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  LogIn,
  Copy,
  Check,
  Play,
  LogOut,
  Wifi,
  AlertCircle,
  User,
  Shield,
  Sparkles,
  RefreshCw,
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { multiplayerClient, ConnectionStatus } from '../game/multiplayerClient';
import { MultiplayerRoom } from '../types/multiplayer';
import { Difficulty, ForestType, GameMode } from '../types/game';
import { HumanCharacterId } from '../game/characterMesh';
import { CHARACTERS_INFO, CharacterSelectModal } from './CharacterSelectModal';
import { ExitConfirmationModal } from './ExitConfirmationModal';
import { soundEngine } from '../game/audio';

interface MultiplayerModalProps {
  onClose: () => void;
  onLaunchGame: (room: MultiplayerRoom) => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  onClose,
  onLaunchGame
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState<string>(
    multiplayerClient.myPlayerName !== 'Survivor' 
      ? multiplayerClient.myPlayerName 
      : 'Survivor ' + Math.floor(100 + Math.random() * 900)
  );
  const [selectedCharacter, setSelectedCharacter] = useState<HumanCharacterId>(
    multiplayerClient.myCharacterId || 'katrina'
  );
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [isCharModalOpen, setIsCharModalOpen] = useState<boolean>(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState<boolean>(false);

  // Host configuration
  const [selectedMode, setSelectedMode] = useState<GameMode>('blood_harvest');
  const [selectedForest, setSelectedForest] = useState<ForestType>('pine_dark');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('realism');

  // Networking state
  const [connStatus, setConnStatus] = useState<ConnectionStatus>(multiplayerClient.getStatus());
  const [connMessage, setConnMessage] = useState<string>('');
  const [ping, setPing] = useState<number>(multiplayerClient.getPing());
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoom | null>(multiplayerClient.currentRoom);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState<boolean>(false);

  // Connect on modal open and bind event listeners
  useEffect(() => {
    // Attempt connection
    multiplayerClient.connect().catch((err) => {
      setErrorMessage(err?.message || 'Failed to connect to multiplayer server.');
    });

    const unsubStatus = multiplayerClient.addListener('onConnectionStatusChange', (status, msg) => {
      setConnStatus(status);
      setConnMessage(msg || '');
      if (status === 'connected') {
        setErrorMessage('');
      }
    });

    const unsubPing = multiplayerClient.addListener('onPingUpdate', (p) => setPing(p));

    const unsubRoomCreated = multiplayerClient.addListener('onRoomCreated', (room) => {
      setCurrentRoom({ ...room });
      setIsCreatingRoom(false);
      setErrorMessage('');
      soundEngine.playMechanicalClick(0.8, 1400);
    });

    const unsubRoomJoined = multiplayerClient.addListener('onRoomJoined', (room) => {
      setCurrentRoom({ ...room });
      setIsJoiningRoom(false);
      setErrorMessage('');
      soundEngine.playMechanicalClick(0.8, 1400);
    });

    const unsubRoomUpdated = multiplayerClient.addListener('onRoomUpdated', (room) => {
      setCurrentRoom({ ...room });
    });

    const unsubPlayerLeft = multiplayerClient.addListener('onPlayerLeft', (sId) => {
      if (sId === multiplayerClient.sessionId) {
        setCurrentRoom(null);
      }
      soundEngine.playMechanicalClick(0.5, 700);
    });

    const unsubGameStarted = multiplayerClient.addListener('onGameStarted', (room) => {
      soundEngine.playMechanicalClick(1.0, 1600);
      onLaunchGame(room);
    });

    const unsubError = multiplayerClient.addListener('onError', (msg) => {
      setErrorMessage(msg);
      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
      soundEngine.playDryFire();
    });

    return () => {
      unsubStatus();
      unsubPing();
      unsubRoomCreated();
      unsubRoomJoined();
      unsubRoomUpdated();
      unsubPlayerLeft();
      unsubGameStarted();
      unsubError();
    };
  }, [onLaunchGame]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    soundEngine.playMechanicalClick(0.4, 1600);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSelectCharacter = (cId: HumanCharacterId) => {
    setSelectedCharacter(cId);
    multiplayerClient.changeCharacter(cId);
    const charName = CHARACTERS_INFO[cId]?.name || cId.toUpperCase();
    setSyncSuccessMessage(`Avatar synchronized: ${charName}`);
    soundEngine.playMechanicalClick(0.6, 1300);

    setTimeout(() => {
      setSyncSuccessMessage('');
    }, 3000);
  };

  const handleCreateRoom = async () => {
    if (isCreatingRoom || isJoiningRoom) return;

    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter a survivor callsign/name.');
      return;
    }

    setErrorMessage('');
    setIsCreatingRoom(true);
    soundEngine.playMechanicalClick(0.6, 1200);

    try {
      const room = await multiplayerClient.createRoom(
        trimmedName,
        selectedCharacter,
        selectedMode,
        selectedForest,
        selectedDifficulty,
        8000
      );
      setCurrentRoom({ ...room });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create room. Please verify connection and retry.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    if (isCreatingRoom || isJoiningRoom) return;

    const code = roomCodeInput.trim().toUpperCase();
    if (!code || code.length !== 6) {
      setErrorMessage('Room code must be exactly 6 characters.');
      return;
    }

    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter a survivor callsign/name.');
      return;
    }

    setErrorMessage('');
    setIsJoiningRoom(true);
    soundEngine.playMechanicalClick(0.6, 1200);

    try {
      const room = await multiplayerClient.joinRoom(code, trimmedName, selectedCharacter, 8000);
      setCurrentRoom({ ...room });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to join room. Please check the room code.');
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleConfirmExit = () => {
    soundEngine.playMechanicalClick(0.5, 800);
    setIsExitConfirmOpen(false);

    if (currentRoom) {
      multiplayerClient.leaveRoom();
      setCurrentRoom(null);
    }

    onClose();
  };

  const handleStartMission = () => {
    if (!currentRoom || !multiplayerClient.isHost) return;
    soundEngine.playMechanicalClick(0.8, 1500);
    multiplayerClient.startGame();
  };

  const charInfo = CHARACTERS_INFO[selectedCharacter] || CHARACTERS_INFO.titan;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-40 flex items-center justify-center p-3 sm:p-4 font-['Plus_Jakarta_Sans'] select-none">
      <div className="bg-neutral-950 border border-red-700/50 rounded-2xl w-full max-w-4xl max-h-[94vh] overflow-hidden shadow-[0_0_60px_rgba(220,38,38,0.25)] flex flex-col">
        
        {/* HEADER BAR */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border-b border-neutral-800 p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-600/40 flex items-center justify-center shadow-inner shrink-0">
              <Users className="w-5 h-5 text-red-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold font-['Chakra_Petch'] text-white tracking-widest flex items-center gap-2">
                ONLINE MULTIPLAYER CO-OP
              </h2>
              <p className="text-[11px] sm:text-xs text-neutral-400 font-mono">
                Squad up with real survivors to endure the forest horrors together
              </p>
            </div>
          </div>

          {/* Connection Status & Exit Button */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono bg-neutral-900/90 border-neutral-800">
              {connStatus === 'connected' ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 font-bold hidden sm:inline">ONLINE</span>
                  <span className="text-neutral-500 text-[10px]">({ping || 20}ms)</span>
                </>
              ) : connStatus === 'connecting' ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-amber-400 font-bold">CONNECTING</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-red-400 font-bold">OFFLINE</span>
                  <button
                    onClick={() => multiplayerClient.connect()}
                    className="ml-1 text-neutral-400 hover:text-white cursor-pointer"
                    title="Retry connection"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* EXIT MULTIPLAYER BUTTON (Lobby Header) */}
            <button
              onClick={() => setIsExitConfirmOpen(true)}
              className="px-3.5 py-2 bg-red-950/80 hover:bg-red-900 border border-red-700/60 hover:border-red-500 text-red-300 hover:text-white rounded-xl text-xs font-bold font-['Chakra_Petch'] tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 min-h-[44px]"
              title="Exit multiplayer"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span className="hidden sm:inline">EXIT</span>
            </button>
          </div>
        </div>

        {/* ERROR NOTIFICATION BANNER */}
        {errorMessage && (
          <div className="bg-red-950/90 border-b border-red-700/60 px-6 py-3 flex items-center justify-between text-xs text-red-200 font-mono">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-red-400 hover:text-white text-xs font-bold px-2 py-0.5 cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* AVATAR SYNC CONFIRMATION BANNER */}
        {syncSuccessMessage && (
          <div className="bg-emerald-950/90 border-b border-emerald-700/60 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-200 font-mono animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncSuccessMessage}</span>
            </div>
            <span className="text-[10px] text-emerald-400">READY</span>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* 1. ROOM LOBBY ACTIVE VIEW */}
          {currentRoom ? (
            <div className="space-y-6">
              
              {/* Room Code Card */}
              <div className="bg-gradient-to-r from-red-950/40 via-neutral-900 to-red-950/30 border border-red-600/50 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(220,38,38,0.15)]">
                <div>
                  <span className="text-[10px] font-mono text-neutral-400 tracking-widest uppercase">
                    AUTHORITATIVE ROOM CODE
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-3xl sm:text-4xl font-extrabold font-['Chakra_Petch'] tracking-widest text-white drop-shadow">
                      {currentRoom.roomCode}
                    </span>
                    <button
                      onClick={() => handleCopyCode(currentRoom.roomCode)}
                      className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 border border-red-600/50 rounded-lg text-xs font-mono text-red-200 flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'COPIED!' : 'COPY'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    Share this 6-character code with your teammates to join your co-op squad.
                  </p>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-neutral-400">OPERATION:</span>
                    <span className="text-xs font-bold font-['Chakra_Petch'] text-red-400 uppercase">
                      {currentRoom.mode.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-neutral-400">ENVIRONMENT:</span>
                    <span className="text-xs font-bold font-['Chakra_Petch'] text-neutral-200 uppercase">
                      {currentRoom.forestType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-neutral-400">REALISM:</span>
                    <span className="text-xs font-bold font-['Chakra_Petch'] text-amber-400 uppercase">
                      {currentRoom.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              {/* SQUAD MEMBERS LIST WITH AVATAR CHANGE IN WAITING ROOM */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold font-['Chakra_Petch'] text-neutral-300 tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-500" /> CONNECTED SURVIVORS ({Object.keys(currentRoom.players).length}/4)
                  </h3>

                  {/* Change Avatar Button in Waiting Room */}
                  <button
                    onClick={() => {
                      soundEngine.playMechanicalClick(0.5, 1200);
                      setIsCharModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-500 rounded-lg text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
                  >
                    <User className="w-3.5 h-3.5 text-red-400" />
                    <span>CHANGE YOUR AVATAR</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.values(currentRoom.players).map((player) => {
                    const pChar = CHARACTERS_INFO[player.characterId] || CHARACTERS_INFO.titan;
                    const isMe = player.sessionId === multiplayerClient.sessionId;
                    return (
                      <div
                        key={player.sessionId}
                        className={`p-4 rounded-xl border flex items-center justify-between ${
                          isMe
                            ? 'bg-neutral-900 border-red-500/60 shadow-md ring-1 ring-red-500/30'
                            : 'bg-neutral-900/60 border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-red-400 font-bold font-['Chakra_Petch']">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-2 font-['Chakra_Petch']">
                              <span>{player.name}</span>
                              {isMe && <span className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.2 rounded font-mono">YOU</span>}
                              {player.isHost && (
                                <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-mono font-bold">
                                  HOST
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-400">
                              Avatar: <span className="text-red-400 font-semibold">{pChar.name.split(' ')[0]}</span> · {pChar.role}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> READY
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty slots placeholders */}
                  {Array.from({ length: 4 - Object.keys(currentRoom.players).length }).map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="p-4 rounded-xl border border-dashed border-neutral-800 bg-neutral-950/40 flex items-center justify-center text-neutral-600 text-xs font-mono"
                    >
                      WAITING FOR TEAMMATE TO JOIN (SLOT {Object.keys(currentRoom.players).length + idx + 1}/4)...
                    </div>
                  ))}
                </div>
              </div>

              {/* LOBBY CONTROLS */}
              <div className="border-t border-neutral-800/80 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Clearly Visible Exit Multiplayer Button in Waiting Screen */}
                <button
                  onClick={() => setIsExitConfirmOpen(true)}
                  className="w-full md:w-auto px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-500 text-neutral-200 hover:text-white rounded-xl text-xs font-bold font-['Chakra_Petch'] tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <LogOut className="w-4 h-4 text-red-400" /> EXIT MULTIPLAYER
                </button>

                {multiplayerClient.isHost ? (
                  <button
                    onClick={handleStartMission}
                    className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-xl text-sm font-extrabold font-['Chakra_Petch'] tracking-widest shadow-[0_0_25px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                  >
                    <Play className="w-4 h-4 fill-white" /> LAUNCH CO-OP DEPLOYMENT
                  </button>
                ) : (
                  <div className="text-xs font-mono text-amber-400 flex items-center gap-2 py-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Waiting for Room Host to deploy the squad into combat...
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* 2. CREATE / JOIN TABBED VIEW (Pre-Lobby) */
            <div className="space-y-6">
              
              {/* SURVIVOR IDENTITY & AVATAR PICKER */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="flex-1 w-full space-y-2">
                  <label className="text-xs font-bold font-['Chakra_Petch'] text-neutral-400 tracking-wider block">
                    YOUR SURVIVOR CALLSIGN / NAME
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={20}
                    placeholder="Enter callsign..."
                    className="w-full px-4 py-2.5 bg-black/80 border border-neutral-700 rounded-xl text-sm text-white font-mono focus:border-red-500 focus:outline-none transition-colors min-h-[44px]"
                  />
                </div>

                <div className="flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-neutral-800 pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] font-mono text-neutral-400 block">SELECTED AVATAR</span>
                    <span className="text-sm font-bold text-white font-['Chakra_Petch']">
                      {charInfo.name.split(' ')[0]}
                    </span>
                    <span className="text-[11px] text-neutral-400 block">{charInfo.role}</span>
                  </div>

                  <button
                    onClick={() => {
                      soundEngine.playMechanicalClick(0.5, 1200);
                      setIsCharModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-700/60 hover:border-red-500 rounded-xl text-xs font-bold font-['Chakra_Petch'] text-red-200 tracking-wider transition-colors cursor-pointer flex items-center gap-2 min-h-[44px]"
                  >
                    <User className="w-4 h-4 text-red-400" /> CHANGE AVATAR
                  </button>
                </div>
              </div>

              {/* TABS HEADER */}
              <div className="flex border-b border-neutral-800">
                <button
                  onClick={() => {
                    soundEngine.playMechanicalClick(0.4, 1100);
                    setActiveTab('create');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-3 text-sm font-bold font-['Chakra_Petch'] tracking-wider flex items-center justify-center gap-2 transition-colors border-b-2 cursor-pointer min-h-[44px] ${
                    activeTab === 'create'
                      ? 'border-red-500 text-white bg-neutral-900/40'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <Plus className="w-4 h-4 text-red-500" /> HOST NEW CO-OP ROOM
                </button>

                <button
                  onClick={() => {
                    soundEngine.playMechanicalClick(0.4, 1100);
                    setActiveTab('join');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-3 text-sm font-bold font-['Chakra_Petch'] tracking-wider flex items-center justify-center gap-2 transition-colors border-b-2 cursor-pointer min-h-[44px] ${
                    activeTab === 'join'
                      ? 'border-red-500 text-white bg-neutral-900/40'
                      : 'border-transparent text-neutral-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4 text-red-500" /> JOIN WITH ROOM CODE
                </button>
              </div>

              {/* TAB 1: CREATE ROOM CONFIG */}
              {activeTab === 'create' && (
                <div className="space-y-6">
                  
                  {/* Mode */}
                  <div>
                    <label className="text-xs font-bold font-['Chakra_Petch'] text-neutral-400 tracking-wider block mb-2">
                      SELECT COMBAT OPERATIONS MODE
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { id: 'blood_harvest' as GameMode, name: 'BLOOD HARVEST', desc: 'Tank escort & Crying Witch' },
                        { id: 'death_toll' as GameMode, name: 'DEATH TOLL', desc: 'Safehouse defense & Sniper slot' },
                        { id: 'creature_mode' as GameMode, name: 'CREATURE MODE', desc: 'All Elite Bosses Active' },
                        { id: 'the_fast_guy' as GameMode, name: 'THE FAST GUY', desc: '6000-Bullet Extreme Gore' }
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMode(m.id)}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer min-h-[56px] ${
                            selectedMode === m.id
                              ? 'bg-red-950/70 border-red-500 text-white shadow-inner'
                              : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <div className="font-bold font-['Chakra_Petch'] text-xs text-white">{m.name}</div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">{m.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Environment & Realism */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-bold font-['Chakra_Petch'] text-neutral-400 tracking-wider block mb-2">
                        ENVIRONMENT SECTOR
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'pine_dark' as ForestType, label: 'Dark Pine' },
                          { id: 'red_mist' as ForestType, label: 'Red Mist' },
                          { id: 'dead_winter' as ForestType, label: 'Winter' }
                        ].map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setSelectedForest(f.id)}
                            className={`p-2.5 rounded-lg border text-center text-xs font-bold font-['Chakra_Petch'] transition-all cursor-pointer min-h-[44px] ${
                              selectedForest === f.id
                                ? 'bg-red-950/60 border-red-500 text-white'
                                : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold font-['Chakra_Petch'] text-neutral-400 tracking-wider block mb-2">
                        REALISM DIFFICULTY
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'veteran' as Difficulty, label: 'VETERAN' },
                          { id: 'realism' as Difficulty, label: 'REALISM' },
                          { id: 'nightmare' as Difficulty, label: 'NIGHTMARE' }
                        ].map((d) => (
                          <button
                            key={d.id}
                            onClick={() => setSelectedDifficulty(d.id)}
                            className={`p-2.5 rounded-lg border text-center text-xs font-bold font-['Chakra_Petch'] transition-all cursor-pointer min-h-[44px] ${
                              selectedDifficulty === d.id
                                ? 'bg-red-950/60 border-red-500 text-white'
                                : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Create Room Button with Loading Indicator and Timeout Protection */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      onClick={() => setIsExitConfirmOpen(true)}
                      className="w-full sm:w-auto px-6 py-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-500 text-neutral-300 hover:text-white font-bold text-xs tracking-wider rounded-xl transition-all font-['Chakra_Petch'] cursor-pointer min-h-[52px] flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4 text-red-400" /> EXIT MULTIPLAYER
                    </button>

                    <button
                      onClick={handleCreateRoom}
                      disabled={isCreatingRoom || isJoiningRoom}
                      className="flex-1 w-full py-4 bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-extrabold text-sm tracking-widest rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-3 font-['Chakra_Petch'] cursor-pointer disabled:opacity-60 min-h-[52px]"
                    >
                      {isCreatingRoom ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>CREATING ROOM & CONTACTING SERVER...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          <span>CREATE ROOM & RECEIVE CODE</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}

              {/* TAB 2: JOIN ROOM WITH CODE */}
              {activeTab === 'join' && (
                <div className="space-y-6 max-w-xl mx-auto py-2">
                  <div className="text-center space-y-1">
                    <h3 className="text-base sm:text-lg font-bold font-['Chakra_Petch'] text-white tracking-wide">
                      ENTER 6-CHARACTER SQUAD ROOM CODE
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Enter the room code given by the host to connect directly to their session.
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <input
                      type="text"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      maxLength={6}
                      placeholder="e.g. FA89X2"
                      className="w-64 text-center tracking-[0.4em] text-3xl font-extrabold font-['Chakra_Petch'] px-4 py-3 bg-black border-2 border-red-600/60 rounded-xl text-white focus:border-red-500 focus:outline-none uppercase placeholder:text-neutral-700 shadow-inner"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={() => setIsExitConfirmOpen(true)}
                      className="w-full sm:w-auto px-6 py-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-500 text-neutral-300 hover:text-white font-bold text-xs tracking-wider rounded-xl transition-all font-['Chakra_Petch'] cursor-pointer min-h-[52px] flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4 text-red-400" /> EXIT MULTIPLAYER
                    </button>

                    <button
                      onClick={handleJoinRoom}
                      disabled={isJoiningRoom || isCreatingRoom || roomCodeInput.length !== 6}
                      className="flex-1 w-full py-4 bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-extrabold text-sm tracking-widest rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-3 font-['Chakra_Petch'] cursor-pointer disabled:opacity-50 min-h-[52px]"
                    >
                      {isJoiningRoom ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>CONNECTING TO SQUAD...</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-5 h-5" />
                          <span>JOIN CO-OP SQUAD</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 text-[11px] text-neutral-400 font-mono space-y-1">
                    <div className="text-neutral-300 font-bold mb-1">TROUBLESHOOTING:</div>
                    <div>• Room codes are 6 letters/digits without spaces (case insensitive).</div>
                    <div>• If joining fails, confirm the host is currently in the lobby and the room is not full.</div>
                    <div>• Real-time synchronization operates at 20 Hz with low latency.</div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="border-t border-neutral-900 bg-neutral-950 p-4 text-center text-xs text-neutral-500 font-mono shrink-0">
          FOREST ALIVE · REAL-TIME WEBSOCKET AUTHORITATIVE MULTIPLAYER ENGINE
        </div>

      </div>

      {/* CHARACTER SELECT MODAL (Works both before and after joining room) */}
      {isCharModalOpen && (
        <CharacterSelectModal
          selectedCharacter={selectedCharacter}
          onSelectCharacter={handleSelectCharacter}
          onClose={() => setIsCharModalOpen(false)}
        />
      )}

      {/* EXIT MULTIPLAYER CONFIRMATION MODAL */}
      <ExitConfirmationModal
        isOpen={isExitConfirmOpen}
        title="EXIT MULTIPLAYER?"
        message="Are you sure you want to leave multiplayer and return to the main menu?"
        onConfirm={handleConfirmExit}
        onCancel={() => setIsExitConfirmOpen(false)}
      />
    </div>
  );
};
