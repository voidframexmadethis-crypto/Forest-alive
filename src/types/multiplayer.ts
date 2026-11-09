import { Difficulty, ForestType, GameMode, WeaponType } from './game';
import { HumanCharacterId } from '../game/characterMesh';

export interface MultiplayerPlayer {
  sessionId: string;
  name: string;
  characterId: HumanCharacterId;
  isHost: boolean;
  ping: number;
  pos: { x: number; y: number; z: number };
  yaw: number;
  pitch: number;
  stance: 'standing' | 'crouched' | 'prone' | 'sliding' | 'diving';
  isSprinting: boolean;
  currentWeapon: WeaponType;
  health: number;
  maxHealth: number;
  lastUpdate: number;
}

export interface MultiplayerRoom {
  roomCode: string;
  hostSessionId: string;
  players: Record<string, MultiplayerPlayer>;
  mode: GameMode;
  forestType: ForestType;
  difficulty: Difficulty;
  status: 'lobby' | 'playing';
  createdAt: number;
}

export type ClientToServerMessage =
  | {
      type: 'create_room';
      playerName: string;
      characterId: HumanCharacterId;
      mode: GameMode;
      forestType: ForestType;
      difficulty: Difficulty;
    }
  | {
      type: 'join_room';
      roomCode: string;
      playerName: string;
      characterId: HumanCharacterId;
    }
  | {
      type: 'leave_room';
    }
  | {
      type: 'start_game';
    }
  | {
      type: 'player_update';
      pos: { x: number; y: number; z: number };
      yaw: number;
      pitch: number;
      stance: 'standing' | 'crouched' | 'prone' | 'sliding' | 'diving';
      isSprinting: boolean;
      currentWeapon: WeaponType;
      health: number;
    }
  | {
      type: 'player_shoot';
      origin: { x: number; y: number; z: number };
      direction: { x: number; y: number; z: number };
      weaponId: WeaponType;
      hitCreatureId?: string;
      damage?: number;
      isHeadshot?: boolean;
      hitPoint?: { x: number; y: number; z: number };
    }
  | {
      type: 'creature_damage';
      creatureId: string;
      damage: number;
      isHeadshot?: boolean;
    }
  | {
      type: 'chat';
      text: string;
    }
  | {
      type: 'ping';
      timestamp: number;
    };

export type ServerToClientMessage =
  | {
      type: 'connected';
      sessionId: string;
    }
  | {
      type: 'room_created';
      room: MultiplayerRoom;
      sessionId: string;
    }
  | {
      type: 'room_joined';
      room: MultiplayerRoom;
      sessionId: string;
    }
  | {
      type: 'room_update';
      room: MultiplayerRoom;
    }
  | {
      type: 'player_joined';
      player: MultiplayerPlayer;
    }
  | {
      type: 'player_left';
      sessionId: string;
      newHostId?: string;
    }
  | {
      type: 'game_started';
      room: MultiplayerRoom;
    }
  | {
      type: 'players_sync';
      players: Record<string, MultiplayerPlayer>;
    }
  | {
      type: 'remote_shoot';
      sessionId: string;
      playerName: string;
      origin: { x: number; y: number; z: number };
      direction: { x: number; y: number; z: number };
      weaponId: WeaponType;
      hitPoint?: { x: number; y: number; z: number };
    }
  | {
      type: 'creature_damaged';
      creatureId: string;
      damage: number;
      attackerSessionId: string;
      attackerName: string;
      isHeadshot?: boolean;
    }
  | {
      type: 'chat_broadcast';
      senderName: string;
      text: string;
      timestamp: number;
    }
  | {
      type: 'error';
      message: string;
      code?: string;
    }
  | {
      type: 'pong';
      timestamp: number;
    };
