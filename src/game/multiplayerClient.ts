import {
  ClientToServerMessage,
  MultiplayerPlayer,
  MultiplayerRoom,
  ServerToClientMessage
} from '../types/multiplayer';
import { Difficulty, ForestType, GameMode, WeaponType } from '../types/game';
import { HumanCharacterId } from './characterMesh';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MultiplayerClientCallbacks {
  onConnectionStatusChange?: (status: ConnectionStatus, message?: string) => void;
  onRoomCreated?: (room: MultiplayerRoom) => void;
  onRoomJoined?: (room: MultiplayerRoom) => void;
  onRoomUpdated?: (room: MultiplayerRoom) => void;
  onPlayerJoined?: (player: MultiplayerPlayer) => void;
  onPlayerLeft?: (sessionId: string, newHostId?: string) => void;
  onGameStarted?: (room: MultiplayerRoom) => void;
  onPlayersSync?: (players: Record<string, MultiplayerPlayer>) => void;
  onRemoteShoot?: (data: {
    sessionId: string;
    playerName: string;
    origin: { x: number; y: number; z: number };
    direction: { x: number; y: number; z: number };
    weaponId: WeaponType;
    hitPoint?: { x: number; y: number; z: number };
  }) => void;
  onCreatureDamaged?: (data: {
    creatureId: string;
    damage: number;
    attackerSessionId: string;
    attackerName: string;
    isHeadshot?: boolean;
  }) => void;
  onChat?: (sender: string, text: string) => void;
  onError?: (message: string, code?: string) => void;
  onPingUpdate?: (pingMs: number) => void;
}

export class MultiplayerClient {
  private static instance: MultiplayerClient | null = null;

  private socket: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private callbacks: MultiplayerClientCallbacks = {};
  private reconnectTimeout: number | null = null;
  private pingInterval: number | null = null;
  private lastPingSentTime: number = 0;
  private currentPing: number = 0;

  public sessionId: string | null = null;
  public currentRoom: MultiplayerRoom | null = null;
  public isHost: boolean = false;
  public myPlayerName: string = 'Survivor';
  public myCharacterId: HumanCharacterId = 'titan';

  public static getInstance(): MultiplayerClient {
    if (!MultiplayerClient.instance) {
      MultiplayerClient.instance = new MultiplayerClient();
    }
    return MultiplayerClient.instance;
  }

  private constructor() {
    // Singleton
  }

  public setCallbacks(callbacks: MultiplayerClientCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getPing(): number {
    return this.currentPing;
  }

  public getWebSocketUrl(): string {
    // 1. Explicit production/staging environment variable override
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }

    // 2. Automatically infer from current window location (works in localhost, Cloud Run, staging, prod)
    if (typeof window !== 'undefined' && window.location) {
      const isSecure = window.location.protocol === 'https:';
      const protocol = isSecure ? 'wss:' : 'ws:';
      const host = window.location.host;
      return `${protocol}//${host}/ws`;
    }

    // 3. Fallback
    return 'ws://localhost:3000/ws';
  }

  public connect(): Promise<void> {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }

    this.updateStatus('connecting', 'Connecting to multiplayer server...');

    return new Promise((resolve, reject) => {
      const url = this.getWebSocketUrl();
      console.log(`[MultiplayerClient] Connecting to WebSocket: ${url}`);

      try {
        this.socket = new WebSocket(url);
      } catch (err: any) {
        this.updateStatus('error', `Connection error: ${err?.message || 'Failed to open WebSocket'}`);
        reject(err);
        return;
      }

      const connectionTimeout = window.setTimeout(() => {
        if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
          this.socket.close();
          this.updateStatus('error', 'Connection timed out. Server may be starting or unreachable.');
          reject(new Error('Connection timed out'));
        }
      }, 7000);

      this.socket.onopen = () => {
        window.clearTimeout(connectionTimeout);
        this.updateStatus('connected', 'Connected to online co-op server');
        this.startHeartbeat();
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const msg: ServerToClientMessage = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (err) {
          console.error('[MultiplayerClient] Malformed packet from server:', err);
        }
      };

      this.socket.onerror = (e) => {
        console.error('[MultiplayerClient] WebSocket error:', e);
        this.updateStatus('error', 'Multiplayer server connection error.');
      };

      this.socket.onclose = (e) => {
        window.clearTimeout(connectionTimeout);
        this.stopHeartbeat();
        this.socket = null;

        if (this.status !== 'error') {
          this.updateStatus('disconnected', 'Disconnected from multiplayer server');
        }

        // Auto-reconnect if we were in a room
        if (this.currentRoom) {
          this.scheduleReconnect();
        }
      };
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      console.log('[MultiplayerClient] Attempting automatic reconnection...');
      this.connect().catch((err) => {
        console.warn('[MultiplayerClient] Reconnect attempt failed:', err);
      });
    }, 4000);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = window.setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.lastPingSentTime = performance.now();
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 5000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private updateStatus(newStatus: ConnectionStatus, message?: string) {
    this.status = newStatus;
    if (this.callbacks.onConnectionStatusChange) {
      this.callbacks.onConnectionStatusChange(newStatus, message);
    }
  }

  private handleServerMessage(msg: ServerToClientMessage) {
    switch (msg.type) {
      case 'connected':
        this.sessionId = msg.sessionId;
        console.log(`[MultiplayerClient] Session assigned: ${msg.sessionId}`);
        break;

      case 'pong': {
        if (this.lastPingSentTime > 0) {
          this.currentPing = Math.round(performance.now() - this.lastPingSentTime);
          if (this.callbacks.onPingUpdate) {
            this.callbacks.onPingUpdate(this.currentPing);
          }
        }
        break;
      }

      case 'room_created':
        this.currentRoom = msg.room;
        this.isHost = true;
        this.sessionId = msg.sessionId;
        console.log(`[MultiplayerClient] Room created: ${msg.room.roomCode}`);
        if (this.callbacks.onRoomCreated) {
          this.callbacks.onRoomCreated(msg.room);
        }
        break;

      case 'room_joined':
        this.currentRoom = msg.room;
        this.isHost = msg.room.hostSessionId === msg.sessionId;
        this.sessionId = msg.sessionId;
        console.log(`[MultiplayerClient] Room joined: ${msg.room.roomCode}`);
        if (this.callbacks.onRoomJoined) {
          this.callbacks.onRoomJoined(msg.room);
        }
        break;

      case 'room_update':
        this.currentRoom = msg.room;
        if (this.sessionId) {
          this.isHost = msg.room.hostSessionId === this.sessionId;
        }
        if (this.callbacks.onRoomUpdated) {
          this.callbacks.onRoomUpdated(msg.room);
        }
        break;

      case 'player_joined':
        if (this.currentRoom) {
          this.currentRoom.players[msg.player.sessionId] = msg.player;
        }
        if (this.callbacks.onPlayerJoined) {
          this.callbacks.onPlayerJoined(msg.player);
        }
        break;

      case 'player_left':
        if (this.currentRoom) {
          delete this.currentRoom.players[msg.sessionId];
          if (msg.newHostId) {
            this.currentRoom.hostSessionId = msg.newHostId;
            if (this.currentRoom.players[msg.newHostId]) {
              this.currentRoom.players[msg.newHostId].isHost = true;
            }
            if (this.sessionId === msg.newHostId) {
              this.isHost = true;
            }
          }
        }
        if (this.callbacks.onPlayerLeft) {
          this.callbacks.onPlayerLeft(msg.sessionId, msg.newHostId);
        }
        break;

      case 'game_started':
        this.currentRoom = msg.room;
        if (this.callbacks.onGameStarted) {
          this.callbacks.onGameStarted(msg.room);
        }
        break;

      case 'players_sync':
        if (this.callbacks.onPlayersSync) {
          this.callbacks.onPlayersSync(msg.players);
        }
        break;

      case 'remote_shoot':
        if (this.callbacks.onRemoteShoot) {
          this.callbacks.onRemoteShoot(msg);
        }
        break;

      case 'creature_damaged':
        if (this.callbacks.onCreatureDamaged) {
          this.callbacks.onCreatureDamaged(msg);
        }
        break;

      case 'chat_broadcast':
        if (this.callbacks.onChat) {
          this.callbacks.onChat(msg.senderName, msg.text);
        }
        break;

      case 'error':
        console.error(`[MultiplayerClient] Server error [${msg.code}]:`, msg.message);
        if (this.callbacks.onError) {
          this.callbacks.onError(msg.message, msg.code);
        }
        break;
    }
  }

  public send(msg: ClientToServerMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(msg));
      } catch (err) {
        console.error('[MultiplayerClient] Failed to send message:', err);
      }
    }
  }

  // Action methods
  public async createRoom(
    playerName: string,
    characterId: HumanCharacterId,
    mode: GameMode,
    forestType: ForestType,
    difficulty: Difficulty
  ): Promise<void> {
    await this.connect();
    this.myPlayerName = playerName;
    this.myCharacterId = characterId;

    this.send({
      type: 'create_room',
      playerName,
      characterId,
      mode,
      forestType,
      difficulty
    });
  }

  public async joinRoom(
    roomCode: string,
    playerName: string,
    characterId: HumanCharacterId
  ): Promise<void> {
    await this.connect();
    this.myPlayerName = playerName;
    this.myCharacterId = characterId;

    this.send({
      type: 'join_room',
      roomCode: roomCode.trim().toUpperCase(),
      playerName,
      characterId
    });
  }

  public leaveRoom() {
    this.send({ type: 'leave_room' });
    this.currentRoom = null;
    this.isHost = false;
  }

  public startGame() {
    if (!this.isHost) return;
    this.send({ type: 'start_game' });
  }

  public sendPlayerUpdate(
    pos: { x: number; y: number; z: number },
    yaw: number,
    pitch: number,
    stance: 'standing' | 'crouched' | 'prone' | 'sliding' | 'diving',
    isSprinting: boolean,
    currentWeapon: WeaponType,
    health: number
  ) {
    this.send({
      type: 'player_update',
      pos,
      yaw,
      pitch,
      stance,
      isSprinting,
      currentWeapon,
      health
    });
  }

  public sendShoot(
    origin: { x: number; y: number; z: number },
    direction: { x: number; y: number; z: number },
    weaponId: WeaponType,
    hitPoint?: { x: number; y: number; z: number },
    hitCreatureId?: string,
    damage?: number,
    isHeadshot?: boolean
  ) {
    this.send({
      type: 'player_shoot',
      origin,
      direction,
      weaponId,
      hitPoint,
      hitCreatureId,
      damage,
      isHeadshot
    });
  }

  public sendCreatureDamage(creatureId: string, damage: number, isHeadshot?: boolean) {
    this.send({
      type: 'creature_damage',
      creatureId,
      damage,
      isHeadshot
    });
  }

  public sendChat(text: string) {
    this.send({
      type: 'chat',
      text
    });
  }
}

export const multiplayerClient = MultiplayerClient.getInstance();
