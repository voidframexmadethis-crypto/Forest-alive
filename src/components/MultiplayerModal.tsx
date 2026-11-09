import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  LogIn,
  Copy,
  Check,
  Play,
  ArrowLeft,
  Wifi,
  WifiOff,
  AlertCircle,
  User,
  Shield,
  Eye,
  Crosshair,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { multiplayerClient, ConnectionStatus } from '../game/multiplayerClient';
import { MultiplayerRoom } from '../types/multiplayer';
import { Difficulty, ForestType, GameMode } from '../types/game';
import { HumanCharacterId } from '../game/characterMesh';
import { CHARACTERS_INFO, CharacterSelectModal } from './CharacterSelectModal';
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
  const [playerName, setPlayerName] = useState<string>('Survivor ' + Math.floor(100 + Math.random() * 900));
  const [selectedCharacter, setSelectedCharacter] = useState<HumanCharacterId>('katrina');
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [isCharModalOpen, setIsCharModalOpen] = useState<boolean>(false);

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
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Connect on modal open
  useEffect(() => {
    multiplayerClient.connect().catch(() => {});

    multiplayerClient.setCallbacks({
      onConnectionStatusChange: (status, message) => {
        setConnStatus(status);
        setConnMessage(message || '');
        if (status === 'connected') {
          setErrorMessage('');
        }
      },
      onPingUpdate: (p) => setPing(p),
      onRoomCreated: (room) => {
        setCurrentRoom({ ...room });
        soundEngine.playMechanicalClick(0.8, 1400);
      },
      onRoomJoined: (room) => {
        setCurrentRoom({ ...room });
        soundEngine.playMechanicalClick(0.8, 1400);
      },
      onRoomUpdated: (room) => {
        setCurrentRoom({ ...room });
      },
      onPlayerJoined: (player) => {
        soundEngine.playMechanicalClick(0.5, 1200);
      },
      onPlayerLeft: () => {
        soundEngine.playMechanicalClick(0.5, 700);
      },
      onGameStarted: (room) => {
        soundEngine.playMechanicalClick(1.0, 1600);
        onLaunchGame(room);
      },
      onError: (msg) => {
        setErrorMessage(msg);
        setIsConnecting(false);
        soundEngine.playDryFire();
      }
    });

    return () => {
      // Keep callbacks alive or clear modal-specific listeners
    };
  }, [onLaunchGame]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    soundEngine.playMechanicalClick(0.4, 1600);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setErrorMessage('Please enter a survivor name.');
      return;
    }
    setErrorMessage('');
    setIsConnecting(true);
    soundEngine.playMechanicalClick(0.6, 1200);

    try {
      await multiplayerClient.createRoom(
        playerName.trim(),
        selectedCharacter,
        selectedMode,
        selectedForest,
        selectedDifficulty
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create room.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleJoinRoom = async () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (!code || code.length !== 6) {
      setErrorMessage('Room code must be exactly 6 characters.');
      return;
    }
    if (!playerName.trim()) {
      setErrorMessage('Please enter a survivor name.');
      return;
    }
    setErrorMessage('');
    setIsConnecting(true);
    soundEngine.playMechanicalClick(0.6, 1200);

    try {
      await multiplayerClient.joinRoom(code, playerName.trim(), selectedCharacter);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to join room.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLeaveRoom = () => {
    multiplayerClient.leaveRoom();
    setCurrentRoom(null);
    setErrorMessage('');
    soundEngine.playMechanicalClick(0.5, 900);
  };

  const handleStartMission = () => {
    if (!currentRoom || !multiplayerClient.isHost) return;
    soundEngine.playMechanicalClick(0.8, 1500);
    multiplayerClient.startGame();
  };

  const charInfo = CHARACTERS_INFO[selectedCharacter] || CHARACTERS_INFO.titan;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 font-['Plus_Jakarta_Sans'] select-none">
      <div className="bg-neutral-950 border border-red-700/50 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-[0_0_60px_rgba(220,38,38,0.25)] flex flex-col">
        
        {/* HEADER BAR */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border-b border-neutral-800 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-600/40 flex items-center justify-center shadow-inner">
              <Users className="w-5 h-5 text-red-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold font-['Chakra_Petch'] text-white tracking-widest flex items-center gap-2">
                ONLINE MULTIPLAYER CO-OP
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Squad up with real survivors to endure the forest horrors together
              </p>
            </div>
          </div>

          {/* Connection Status Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono bg-neutral-900 border-neutral-800">
              {connStatus === 'connected' ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 font-bold">ONLINE</span>
                  <span className="text-neutral-500 text-[10px]">({ping}ms)</span>
                </>
              ) : connStatus === 'connecting' ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-amber-400 font-bold">CONNECTING...</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-red-400 font-bold">OFFLINE</span>
                  <button
                    onClick={() => multiplayerClient.connect()}
                    className="ml-1 text-neutral-400 hover:text-white"
                    title="Retry connection"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => {
                soundEngine.playMechanicalClick(0.5, 900);
                if (currentRoom) handleLeaveRoom();
                onClose();
              }}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-red-500 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ERROR NOTIFICATION BANNER */}
        {errorMessage && (
          <div className="bg-red-950/80 border-b border-red-700/60 px-6 py-3 flex items-center justify-between text-xs text-red-200 font-mono">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-red-400 hover:text-white text-xs font-bold px-2 py-0.5"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 1. ROOM LOBBY ACTIVE VIEW */}
          {currentRoom ? (
            <div className="space-y-6">
              
              {/* Room Code Card */}
              <div className="bg-gradient-to-r from-red-950/40 via-neutral-900 to-red-950/30 border border-red-600/50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(220,38,38,0.15)]">
                <div>
                  <span className="text-[10px] font-mono text-neutral-400 tracking-widest uppercase">
                    AUTHORITATIVE ROOM CODE
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-4xl font-extrabold font-['Chakra_Petch'] tracking-widest text-white drop-shadow">
                      {currentRoom.roomCode}
                    </span>
                    <button
                      onClick={() => handleCopyCode(currentRoom.roomCode)}
                      className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 border border-red-600/50 rounded-lg text-xs font-mono text-red-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'COPIED!' : 'COPY'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400 mt-2">
                    Share this 6-character code with your teammates to join your co-op lobby.
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

              {/* SQUAD MEMBERS LIST */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold font-['Chakra_Petch'] text-neutral-300 tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-500" /> CONNECTED SURVIVORS ({Object.keys(currentRoom.players).length}/4)
                  </h3>
                  <span className="text-xs text-neutral-500 font-mono">
                    Host: {currentRoom.players[currentRoom.hostSessionId]?.name || 'Assigned'}
                  </span>
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
                            ? 'bg-neutral-900 border-red-500/60 shadow-md'
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

                        <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" /> READY
                        </span>
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
                <button
                  onClick={handleLeaveRoom}
                  className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-xl text-xs font-bold font-['Chakra_Petch'] tracking-wider cursor-pointer transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> LEAVE ROOM
                </button>

                {multiplayerClient.isHost ? (
                  <button
                    onClick={handleStartMission}
                    className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 text-white rounded-xl text-sm font-extrabold font-['Chakra_Petch'] tracking-widest shadow-[0_0_25px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" /> LAUNCH CO-OP DEPLOYMENT
                  </button>
                ) : (
                  <div className="text-xs font-mono text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Waiting for Room Host to deploy the squad into combat...
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* 2. CREATE / JOIN TABBED VIEW */
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
                    className="w-full px-4 py-2.5 bg-black/80 border border-neutral-700 rounded-xl text-sm text-white font-mono focus:border-red-500 focus:outline-none transition-colors"
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
                    className="px-4 py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-700/60 hover:border-red-500 rounded-xl text-xs font-bold font-['Chakra_Petch'] text-red-200 tracking-wider transition-colors cursor-pointer flex items-center gap-2"
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
                  className={`flex-1 py-3 text-sm font-bold font-['Chakra_Petch'] tracking-wider flex items-center justify-center gap-2 transition-colors border-b-2 cursor-pointer ${
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
                  className={`flex-1 py-3 text-sm font-bold font-['Chakra_Petch'] tracking-wider flex items-center justify-center gap-2 transition-colors border-b-2 cursor-pointer ${
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
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
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
                            className={`p-2.5 rounded-lg border text-center text-xs font-bold font-['Chakra_Petch'] transition-all cursor-pointer ${
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
                            className={`p-2.5 rounded-lg border text-center text-xs font-bold font-['Chakra_Petch'] transition-all cursor-pointer ${
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

                  {/* Create Room Button */}
                  <button
                    onClick={handleCreateRoom}
                    disabled={isConnecting}
                    className="w-full py-4 bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-extrabold text-sm tracking-widest rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-3 font-['Chakra_Petch'] cursor-pointer disabled:opacity-60"
                  >
                    <Plus className="w-5 h-5" />
                    {isConnecting ? 'CREATING SECURE ROOM...' : 'CREATE ROOM & RECEIVE CODE'}
                  </button>

                </div>
              )}

              {/* TAB 2: JOIN ROOM WITH CODE */}
              {activeTab === 'join' && (
                <div className="space-y-6 max-w-xl mx-auto py-4">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-bold font-['Chakra_Petch'] text-white tracking-wide">
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

                  <button
                    onClick={handleJoinRoom}
                    disabled={isConnecting || roomCodeInput.length !== 6}
                    className="w-full py-4 bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-extrabold text-sm tracking-widest rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center gap-3 font-['Chakra_Petch'] cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-5 h-5" />
                    {isConnecting ? 'CONNECTING TO SQUAD...' : 'JOIN CO-OP SQUAD'}
                  </button>

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

      {/* CHARACTER SELECT MODAL */}
      {isCharModalOpen && (
        <CharacterSelectModal
          selectedCharacter={selectedCharacter}
          onSelectCharacter={(cId) => setSelectedCharacter(cId)}
          onClose={() => setIsCharModalOpen(false)}
        />
      )}
    </div>
  );
};
