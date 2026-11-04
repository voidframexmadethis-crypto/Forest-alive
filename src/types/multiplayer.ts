import { Difficulty, ForestType, GameMode } from './game';
import { HumanCharacterId } from '../game/characterMesh';

export interface NetworkPlayer {
  id: string;
  name: string;
  characterId: HumanCharacterId | null;
  isReady: boolean;
  isHost: boolean;
  ping: number;
  position: { x: number; y: number; z: number };
  rotation: { yaw: number; pitch: number; roll: number };
  stance: 'standing' | 'crouching' | 'prone' | 'sliding' | 'sprinting';
  isAiming: boolean;
  isShooting: boolean;
  isReloading: boolean;
  weaponId: string;
  health: number;
  maxHealth: number;
  isDowned: boolean;
  isDead: boolean;
  kills: number;
}

export interface MultiplayerRoom {
  code: string;
  hostId: string;
  maxPlayers: number;
  mode: GameMode;
  forestType: ForestType;
  difficulty: Difficulty;
  status: 'lobby' | 'cinematic' | 'in_game' | 'game_over' | 'victory';
  players: Record<string, NetworkPlayer>;
  createdAt: number;
  successionEventComplete: boolean;
  completedMissions: number;
  currentMission: number;
  isCampaignComplete: boolean;
  natashaSkillLevel: number;
}

export interface SyncedCreature {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  health: number;
  maxHealth: number;
  state: string;
  targetPlayerId?: string;
}

export type ClientMessage =
  | { type: 'create_room'; name: string; characterId?: HumanCharacterId; mode: GameMode; forestType: ForestType; difficulty: Difficulty }
  | { type: 'join_room'; code: string; name: string; characterId?: HumanCharacterId }
  | { type: 'leave_room' }
  | { type: 'select_character'; characterId: HumanCharacterId }
  | { type: 'toggle_ready'; isReady: boolean }
  | { type: 'start_game' }
  | { type: 'player_update'; data: Partial<NetworkPlayer> }
  | { type: 'shoot_bullet'; origin: { x: number; y: number; z: number }; direction: { x: number; y: number; z: number }; weaponId: string; hitPoint?: { x: number; y: number; z: number } }
  | { type: 'creature_damage'; creatureId: string; damage: number; hitLocation?: string }
  | { type: 'sync_creatures'; creatures: SyncedCreature[] }
  | { type: 'revive_player'; targetPlayerId: string }
  | { type: 'complete_mission' }
  | { type: 'story_event_trigger'; event: 'katrina_labor' }
  | { type: 'ping'; timestamp: number };

export type ServerMessage =
  | { type: 'room_created'; room: MultiplayerRoom; playerId: string }
  | { type: 'room_joined'; room: MultiplayerRoom; playerId: string }
  | { type: 'room_update'; room: MultiplayerRoom }
  | { type: 'game_started'; room: MultiplayerRoom }
  | { type: 'player_update'; playerId: string; data: Partial<NetworkPlayer> }
  | { type: 'bullet_fired'; playerId: string; origin: { x: number; y: number; z: number }; direction: { x: number; y: number; z: number }; weaponId: string; hitPoint?: { x: number; y: number; z: number } }
  | { type: 'creatures_synced'; creatures: SyncedCreature[] }
  | { type: 'creature_damage'; playerId: string; creatureId: string; damage: number; hitLocation?: string }
  | { type: 'player_downed'; playerId: string; playerName: string; characterId: string }
  | { type: 'player_revived'; reviverId: string; targetId: string }
  | { type: 'story_event_triggered'; event: 'katrina_labor' }
  | { type: 'error'; message: string }
  | { type: 'pong'; timestamp: number };
