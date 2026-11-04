import React, { useState, useEffect } from 'react';
import { MultiplayerRoom, NetworkPlayer } from '../types/multiplayer';
import { HumanCharacterId } from '../game/characterMesh';
import { CHARACTERS_INFO } from './CharacterSelectModal';
import { networkClient, ConnectionStatus } from '../game/multiplayer/NetworkClient';
import { soundEngine } from '../game/audio';
import { Difficulty, ForestType, GameMode } from '../types/game';
import { Users, Copy, Check, Shield, AlertCircle, Play, ArrowLeft, Radio, Wifi, WifiOff, Crown, Sparkles, CheckCircle2, Lock } from 'lucide-react';

interface MultiplayerLobbyModalProps {
  onClose: () => void;
  onStartMultiplayerGame: (room: MultiplayerRoom, localPlayerId: string) => void;
  onPlayCinematic: () => void;
}

export const MultiplayerLobbyModal: React.FC<MultiplayerLobbyModalProps> = ({
  onClose,
  onStartMultiplayerGame,
  onPlayCinematic
}) => {
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('forest_alive_multiplayer_name') || `Survivor_${Math.floor(100 + Math.random() * 900)}`;
  });
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [selectedChar, setSelectedChar] = useState<HumanCharacterId>('titan');
  const [selectedMode, setSelectedMode] = useState<GameMode>('blood_harvest');
  const [selectedForest, setSelectedForest] = useState<ForestType>('pine_dark');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('realism');

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(networkClient.getStatus());
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoom | null>(networkClient.currentRoom);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(networkClient.localPlayerId);
  const [ping, setPing] = useState<number>(networkClient.currentPing);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [view, setView] = useState<'entry' | 'create' | 'lobby'>(networkClient.currentRoom ? 'lobby' : 'entry');

  useEffect(() => {
    // Connect to real WebSocket server
    networkClient.connect();

    networkClient.setListeners({
      onConnectionChange: (status) => setConnectionStatus(status),
      onPingUpdate: (ms) => setPing(ms),
      onRoomCreated: (room, pId) => {
        soundEngine.playMechanicalClick(0.7, 1400);
        setCurrentRoom(room);
        setLocalPlayerId(pId);
        setView('lobby');
        setErrorMessage('');
      },
      onRoomJoined: (room, pId) => {
        soundEngine.playMechanicalClick(0.7, 1400);
        setCurrentRoom(room);
        setLocalPlayerId(pId);
        setView('lobby');
        setErrorMessage('');
      },
      onRoomUpdate: (room) => {
        setCurrentRoom({ ...room });
      },
      onGameStarted: (room) => {
        soundEngine.playReloadSound();
        const pId = networkClient.localPlayerId;
        if (pId) {
          onStartMultiplayerGame(room, pId);
        }
      },
      onError: (msg) => {
        soundEngine.playCreatureSound('witch_crying');
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(''), 5000);
      }
    });

    return () => {
      // Do not disconnect immediately if in room
    };
  }, [onStartMultiplayerGame]);

  const handleNameChange = (val: string) => {
    setPlayerName(val);
    localStorage.setItem('forest_alive_multiplayer_name', val);
  };

  const handleCreateRoom = () => {
    soundEngine.playMechanicalClick(0.6, 1200);
    networkClient.createRoom(playerName, selectedChar, selectedMode, selectedForest, selectedDifficulty);
  };

  const handleJoinRoom = () => {
    if (!joinCodeInput.trim()) {
      setErrorMessage('Please enter a 6-character room code.');
      return;
    }
    soundEngine.playMechanicalClick(0.6, 1200);
    networkClient.joinRoom(joinCodeInput.trim().toUpperCase(), playerName, selectedChar);
  };

  const handleSelectCharacter = (cId: HumanCharacterId) => {
    setSelectedChar(cId);
    if (currentRoom) {
      soundEngine.playMechanicalClick(0.5, 1100);
      networkClient.selectCharacter(cId);
    }
  };

  const handleToggleReady = () => {
    if (!currentRoom || !localPlayerId) return;
    const me = currentRoom.players[localPlayerId];
    if (!me) return;

    soundEngine.playMechanicalClick(0.7, me.isReady ? 900 : 1600);
    networkClient.toggleReady(!me.isReady);
  };

  const handleStartGame = () => {
    soundEngine.playMechanicalClick(0.8, 1800);
    networkClient.startGame();
  };

  const handleCopyCode = () => {
    if (currentRoom?.code) {
      navigator.clipboard.writeText(currentRoom.code);
      setCopiedCode(true);
      soundEngine.playMechanicalClick(0.5, 1500);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleLeaveRoom = () => {
    soundEngine.playMechanicalClick(0.5, 900);
    networkClient.leaveRoom();
    setCurrentRoom(null);
    setLocalPlayerId(null);
    setView('entry');
  };

  const localPlayer = currentRoom && localPlayerId ? currentRoom.players[localPlayerId] : null;
  const isHost = localPlayer?.isHost ?? false;
  
  // Auto-switch character if Katrina was selected after succession event
  useEffect(() => {
    if (currentRoom?.successionEventComplete && localPlayer?.characterId === 'katrina') {
      networkClient.selectCharacter('natasha');
      setSelectedChar('natasha');
    }
  }, [currentRoom?.successionEventComplete, localPlayer?.characterId]);

  const playerList = currentRoom ? Object.values(currentRoom.players) : [];
  const allReady = playerList.length > 0 && playerList.every((p) => p.isReady);

  // Available 5 protagonists
  // Available protagonists - removed after story event
  const protagonistIds: HumanCharacterId[] = currentRoom?.successionEventComplete 
    ? ['titan', 'natasha', 'bill', 'luis']
    : ['titan', 'katrina', 'natasha', 'bill', 'luis'];


  return (
    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-3 md:p-6 select-none font-['Plus_Jakarta_Sans'] overflow-y-auto">
      <div className="bg-neutral-950 border border-red-600/50 rounded-2xl w-full max-w-4xl shadow-[0_0_60px_rgba(220,38,38,0.3)] flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* TOP STATUS BAR */}
        <div className="flex items-center justify-between border-b border-neutral-800 p-4 md:p-5 bg-neutral-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-red-500 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-extrabold font-['Chakra_Petch'] text-white tracking-wider">
                  FOREST ALIVE · ONLINE MULTIPLAYER CO-OP
                </h2>
                <span className="text-[9px] bg-red-600/30 text-red-400 border border-red-500/50 px-2 py-0.5 rounded font-mono font-bold">
                  5-PLAYER MAX
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono">
                Real-Time Synchronized Cooperative Tactical Survival
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real Network Status Indicator */}
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-xl font-mono text-[10px]">
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-bold hidden sm:inline">ONLINE</span>
                  <span className="text-neutral-400">{ping > 0 ? `${ping}ms` : 'Syncing'}</span>
                </>
              ) : connectionStatus === 'connecting' ? (
                <>
                  <Radio className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span className="text-amber-400 font-bold">CONNECTING</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-red-400 font-bold">OFFLINE</span>
                </>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-red-500 text-neutral-400 hover:text-white rounded-lg transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ERROR BANNER */}
        {errorMessage && (
          <div className="bg-red-950/90 border-b border-red-600 p-3 text-xs text-red-200 font-bold flex items-center justify-center gap-2 animate-bounce">
            <AlertCircle className="w-4 h-4 text-red-400" />
            {errorMessage}
          </div>
        )}

        {/* BODY CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

          {/* VIEW 1: ENTRY / JOIN / CREATE SELECTION */}
          {view === 'entry' && (
            <div className="space-y-6 max-w-2xl mx-auto py-4">
              {/* Nickname Field */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-xl space-y-2">
                <label className="text-xs font-bold font-['Chakra_Petch'] text-neutral-300 uppercase tracking-wider block">
                  SURVIVOR CODENAME / CALLSIGN
                </label>
                <input
                  type="text"
                  value={playerName}
                  maxLength={18}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-black/60 border border-neutral-700 focus:border-red-500 rounded-lg px-4 py-2.5 text-sm text-white font-mono outline-none transition-all"
                  placeholder="Enter your tactical callsign..."
                />
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Create Room Card */}
                <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 hover:border-red-500/80 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xl transition-all">
                  <div>
                    <div className="w-10 h-10 bg-red-950/80 border border-red-600/60 rounded-xl flex items-center justify-center mb-3">
                      <Users className="w-5 h-5 text-red-500" />
                    </div>
                    <h3 className="text-base font-extrabold font-['Chakra_Petch'] text-white tracking-wide">
                      HOST COOPERATIVE ROOM
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                      Generate a private tactical room code and lead up to 5 survivors into the dark forest.
                    </p>
                  </div>

                  <button
                    onClick={() => setView('create')}
                    className="w-full py-3 bg-red-700 hover:bg-red-600 border border-red-500 text-white font-bold text-xs font-['Chakra_Petch'] tracking-widest rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                  >
                    CONFIG & CREATE ROOM →
                  </button>
                </div>

                {/* Join Room Card */}
                <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 hover:border-amber-500/80 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xl transition-all">
                  <div>
                    <div className="w-10 h-10 bg-amber-950/80 border border-amber-600/60 rounded-xl flex items-center justify-center mb-3">
                      <Radio className="w-5 h-5 text-amber-500 animate-pulse" />
                    </div>
                    <h3 className="text-base font-extrabold font-['Chakra_Petch'] text-white tracking-wide">
                      JOIN ROOM WITH CODE
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                      Enter a 6-character room code from your squad leader to rendezvous.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      className="w-full bg-black/80 border border-neutral-700 focus:border-amber-500 rounded-lg px-3 py-2 text-center text-lg font-mono text-amber-400 tracking-widest uppercase outline-none"
                      placeholder="ROOM CODE"
                    />
                    <button
                      onClick={handleJoinRoom}
                      disabled={!joinCodeInput.trim() || connectionStatus !== 'connected'}
                      className="w-full py-2.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 border border-amber-500 text-white font-bold text-xs font-['Chakra_Petch'] tracking-widest rounded-xl transition-all cursor-pointer shadow-lg"
                    >
                      CONNECT TO SQUAD
                    </button>
                  </div>
                </div>
              </div>

              {/* Realism Notice */}
              <div className="bg-black/50 border border-neutral-800/80 p-4 rounded-xl text-center space-y-1">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">
                  NETWORK INFRASTRUCTURE: AUTHENTIC NODE WEBSOCKETS (NO MOCK BOTS)
                </span>
                <p className="text-xs text-neutral-400">
                  Every player in the session is a real connected device. Positions, ballistics, zombies, and revives are synchronized in real-time.
                </p>
              </div>
            </div>
          )}

          {/* VIEW 2: CONFIGURE ROOM PARAMETERS BEFORE CREATING */}
          {view === 'create' && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-base font-bold font-['Chakra_Petch'] text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-500" /> SQUAD MISSION PARAMETERS
                </h3>
                <button
                  onClick={() => setView('entry')}
                  className="text-xs text-neutral-400 hover:text-white font-mono flex items-center gap-1"
                >
                  ← Back
                </button>
              </div>

              {/* Game Mode */}
              <div className="space-y-2">
                <label className="text-xs font-bold font-['Chakra_Petch'] text-neutral-400 uppercase">
                  Combat Mission Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'blood_harvest', name: 'Blood Harvest', desc: 'Tank Escort & Crying Witch Woods' },
                    { id: 'death_toll', name: 'Death Toll', desc: 'Safehouse Fortification & Telescope Sniper' },
                    { id: 'creature_mode', name: 'Creature Mode', desc: 'All Elite Monsters Active' },
                    { id: 'the_fast_guy', name: 'The Fast Guy', desc: '6,000 Bullet Multi-Stream' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMode(m.id as GameMode)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedMode === m.id
                          ? 'bg-red-950/80 border-red-500 text-white shadow-md'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold font-['Chakra_Petch']">{m.name}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Forest Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold font-['Chakra_Petch'] text-neutral-400 uppercase">
                  Forest Environment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pine_dark', label: 'Dark Pine' },
                    { id: 'red_mist', label: 'Red Mist' },
                    { id: 'dead_winter', label: 'Dead Winter' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedForest(f.id as ForestType)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold font-['Chakra_Petch'] transition-all ${
                        selectedForest === f.id
                          ? 'bg-red-950/80 border-red-500 text-white'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Host Initial Character Choice */}
              <div className="space-y-2">
                <label className="text-xs font-bold font-['Chakra_Petch'] text-neutral-400 uppercase">
                  Your Lead Protagonist
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {protagonistIds.map((cId) => {
                    const info = CHARACTERS_INFO[cId];
                    const isSel = selectedChar === cId;
                    return (
                      <button
                        key={cId}
                        onClick={() => setSelectedChar(cId)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isSel
                            ? 'bg-red-950/80 border-red-500 text-white shadow-md'
                            : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <div className="text-[11px] font-bold font-['Chakra_Petch'] truncate">{info.name.split(' ')[0]}</div>
                        <div className="text-[9px] text-neutral-500 truncate">{info.role.split(' ')[0]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={connectionStatus !== 'connected'}
                className="w-full py-3.5 bg-red-700 hover:bg-red-600 border border-red-500 text-white font-extrabold text-xs font-['Chakra_Petch'] tracking-widest rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              >
                INITIALIZE ROOM & LOBBY →
              </button>
            </div>
          )}

          {/* VIEW 3: LIVE PLAYER LOBBY */}
          {view === 'lobby' && currentRoom && (
            <div className="space-y-6">
              {/* Room Header Code Card */}
              <div className="bg-gradient-to-r from-red-950/60 via-neutral-900 to-neutral-950 border border-red-600/40 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">TACTICAL ROOM CODE:</span>
                    <span className="text-2xl font-extrabold font-['Chakra_Petch'] text-red-500 tracking-widest">
                      {currentRoom.code}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="p-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-lg transition-all ml-1"
                      title="Copy room code"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-neutral-400 font-mono">
                    <span>MODE: <b className="text-white uppercase">{currentRoom.mode.replace('_', ' ')}</b></span>
                    <span>·</span>
                    <span>ENVIRONMENT: <b className="text-white uppercase">{currentRoom.forestType.replace('_', ' ')}</b></span>
                    <span>·</span>
                    <span>SQUAD: <b className="text-amber-400">{playerList.length} / 5 PLAYERS</b></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLeaveRoom}
                    className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded-xl text-xs font-bold font-['Chakra_Petch'] cursor-pointer transition-all"
                  >
                    LEAVE ROOM
                  </button>
                </div>
              </div>

              {/* 5 SURVIVOR SLOTS */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold font-['Chakra_Petch'] text-neutral-400 uppercase">
                  <span>CO-OP SQUAD ROSTER (5 SURVIVORS)</span>
                  <span className="text-neutral-500 font-mono text-[10px]">NO DUPLICATE CHARACTERS PERMITTED</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {Array.from({ length: 5 }).map((_, slotIdx) => {
                    const p = playerList[slotIdx];
                    if (p) {
                      const charInfo = p.characterId ? CHARACTERS_INFO[p.characterId] : null;
                      const isMe = p.id === localPlayerId;
                      return (
                        <div
                          key={p.id}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all relative ${
                            isMe 
                              ? 'bg-neutral-900/90 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)]' 
                              : 'bg-neutral-900/50 border-neutral-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase">
                                SLOT {slotIdx + 1} {isMe && <b className="text-red-400">(YOU)</b>}
                              </span>
                              {p.isHost && (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400 font-mono bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-600/40">
                                  <Crown className="w-2.5 h-2.5" /> HOST
                                </span>
                              )}
                            </div>

                            <div className="font-extrabold text-sm font-['Chakra_Petch'] text-white truncate">
                              {p.name}
                            </div>

                            {charInfo ? (
                              <div className="mt-1">
                                <span className="text-xs font-bold text-red-400 font-['Chakra_Petch'] block truncate">
                                  {charInfo.name.split(' ')[0]}
                                </span>
                                <span className="text-[10px] text-neutral-400 block truncate font-sans">
                                  {charInfo.role}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-neutral-500 italic block mt-1">
                                Selecting character...
                              </span>
                            )}
                          </div>

                          <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                            <span className="text-[9px] font-mono text-neutral-500">STATUS:</span>
                            {p.isReady ? (
                              <span className="text-[10px] font-bold text-emerald-400 font-mono flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                                <CheckCircle2 className="w-3 h-3" /> READY
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-400 font-mono flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                                WAITING
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Empty Slot
                    return (
                      <div
                        key={`empty_${slotIdx}`}
                        className="p-3.5 rounded-xl border border-dashed border-neutral-800 bg-black/30 flex flex-col justify-center items-center text-center opacity-60 min-h-[110px]"
                      >
                        <Users className="w-5 h-5 text-neutral-600 mb-1" />
                        <span className="text-[9px] font-mono text-neutral-500 uppercase">
                          SLOT {slotIdx + 1}
                        </span>
                        <span className="text-[10px] text-neutral-600 font-mono">
                          Awaiting Survivor...
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CHARACTER SELECTION CARDS (5 Protagonists) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold font-['Chakra_Petch'] text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-red-500" /> SELECT YOUR PROTAGONIST
                  </label>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Your current: <b className="text-red-400 uppercase">{CHARACTERS_INFO[selectedChar]?.name || selectedChar}</b>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {protagonistIds.map((cId) => {
                    const info = CHARACTERS_INFO[cId];
                    // Check if taken by another player in the room
                    const takenBy = playerList.find((p) => p.id !== localPlayerId && p.characterId === cId);
                    const isSelectedByMe = localPlayer?.characterId === cId;

                    return (
                      <div
                        key={cId}
                        onClick={() => {
                          if (!takenBy) {
                            handleSelectCharacter(cId);
                          }
                        }}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                          takenBy
                            ? 'bg-neutral-950/60 border-neutral-800/80 opacity-50 cursor-not-allowed'
                            : isSelectedByMe
                            ? 'bg-red-950/90 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.35)] cursor-pointer'
                            : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-600 cursor-pointer'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-extrabold font-['Chakra_Petch'] text-white">
                              {info.name.split(' ')[0]}
                            </span>
                            {takenBy ? (
                              <Lock className="w-3.5 h-3.5 text-neutral-500" />
                            ) : isSelectedByMe ? (
                              <CheckCircle2 className="w-4 h-4 text-red-400" />
                            ) : null}
                          </div>

                          <div className="text-[10px] text-neutral-400 line-clamp-1">{info.role}</div>
                          <div className="text-[9px] text-amber-400 mt-2 line-clamp-2 font-mono">
                            {info.perk}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-neutral-800/80">
                          {takenBy ? (
                            <span className="text-[9px] font-mono text-red-400/80 font-bold block truncate">
                              Taken by {takenBy.name}
                            </span>
                          ) : isSelectedByMe ? (
                            <span className="text-[9px] font-mono text-emerald-400 font-bold block">
                              SELECTED BY YOU
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-neutral-500 block hover:text-white">
                              Click to select
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTION FOOTER BAR */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800">
                <div className="text-xs text-neutral-400 font-mono">
                  {isHost ? (
                    <span>👑 As Host, you command deployment once survivors are ready.</span>
                  ) : (
                    <span>Toggle READY to confirm your loadout with the squad leader.</span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* READY TOGGLE */}
                  <button
                    onClick={handleToggleReady}
                    className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-xs font-extrabold font-['Chakra_Petch'] tracking-widest cursor-pointer transition-all border ${
                      localPlayer?.isReady
                        ? 'bg-emerald-900/80 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-amber-950/80 border-amber-600 text-amber-200 hover:border-amber-400'
                    }`}
                  >
                    {localPlayer?.isReady ? '✓ READY FOR COMBAT' : 'SET READY'}
                  </button>

                  {/* START GAME BUTTON (HOST ONLY) */}
                  {isHost && (
                    <button
                      onClick={handleStartGame}
                      disabled={!allReady}
                      className="flex-1 sm:flex-none px-8 py-3 bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed border border-red-500 text-white font-extrabold text-xs font-['Chakra_Petch'] tracking-widest rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-white" /> DEPLOY SQUAD (START)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
