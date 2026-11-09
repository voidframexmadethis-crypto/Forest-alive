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
  onCharacterChanged?: (sessionId: string, characterId: HumanCharacterId) => void;
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

type EventListenerMap = {
  [K in keyof MultiplayerClientCallbacks]?: Set<NonNullable<MultiplayerClientCallbacks[K]>>;
};

export class MultiplayerClient {
  private static instance: MultiplayerClient | null = null;

  private socket: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private callbacks: MultiplayerClientCallbacks = {};
  private listeners: EventListenerMap = {};
  private reconnectTimeout: number | null = null;
  private pingInterval: number | null = null;
  private lastPingSentTime: number = 0;
  private currentPing: number = 0;
  private connectPromise: Promise<void> | null = null;

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

  public addListener<K extends keyof MultiplayerClientCallbacks>(
    event: K,
    fn: NonNullable<MultiplayerClientCallbacks[K]>
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set() as any;
    }
    (this.listeners[event] as Set<any>).add(fn);

    return () => {
      this.removeListener(event, fn);
    };
  }

  public removeListener<K extends keyof MultiplayerClientCallbacks>(
    event: K,
    fn: NonNullable<MultiplayerClientCallbacks[K]>
  ) {
    if (this.listeners[event]) {
      (this.listeners[event] as Set<any>).delete(fn);
    }
  }

  private emit<K extends keyof MultiplayerClientCallbacks>(
    event: K,
    ...args: any[]
  ) {
    // 1. Direct legacy callback
    const cb = this.callbacks[event] as any;
    if (typeof cb === 'function') {
      try {
        cb(...args);
      } catch (err) {
        console.error(`[MultiplayerClient] Callback error for ${event}:`, err);
      }
    }

    // 2. Multi-listener subscribers
    const set = this.listeners[event];
    if (set && set.size > 0) {
      set.forEach((fn: any) => {
        try {
          fn(...args);
        } catch (err) {
          console.error(`[MultiplayerClient] Listener error for ${event}:`, err);
        }
      });
    }
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
    // If already fully connected and open, resolve immediately
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    // If a connection is already in progress, return the existing in-flight promise
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.updateStatus('connecting', 'Connecting to multiplayer server...');

    this.connectPromise = new Promise<void>((resolve, reject) => {
      const url = this.getWebSocketUrl();
      console.log(`[MultiplayerClient] Connecting to WebSocket: ${url}`);

      // Clean up any stale closed/closing socket
      if (this.socket) {
        try {
          this.socket.onopen = null;
          this.socket.onmessage = null;
          this.socket.onerror = null;
          this.socket.onclose = null;
          this.socket.close();
        } catch {}
        this.socket = null;
      }

      try {
        this.socket = new WebSocket(url);
      } catch (err: any) {
        const errorMsg = `Connection failed: ${err?.message || 'Unable to open WebSocket'}`;
        this.updateStatus('error', errorMsg);
        this.connectPromise = null;
        reject(new Error(errorMsg));
        return;
      }

      let isResolved = false;

      // 7-second connection timeout
      const connectionTimeout = window.setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          this.connectPromise = null;
          if (this.socket) {
            try { this.socket.close(); } catch {}
            this.socket = null;
          }
          const msg = 'Connection timed out. The server may be starting or unreachable. Please try again.';
          this.updateStatus('error', msg);
          reject(new Error(msg));
        }
      }, 7000);

      this.socket.onopen = () => {
        if (isResolved) return;
        isResolved = true;
        window.clearTimeout(connectionTimeout);
        this.connectPromise = null;
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
        console.error('[MultiplayerClient] WebSocket error event:', e);
        if (!isResolved) {
          isResolved = true;
          window.clearTimeout(connectionTimeout);
          this.connectPromise = null;
          const msg = 'Multiplayer server connection error. Server may be unreachable.';
          this.updateStatus('error', msg);
          reject(new Error(msg));
        } else {
          this.updateStatus('error', 'Multiplayer server encountered an error.');
        }
      };

      this.socket.onclose = (e) => {
        window.clearTimeout(connectionTimeout);
        this.stopHeartbeat();
        this.socket = null;

        if (!isResolved) {
          isResolved = true;
          this.connectPromise = null;
          const msg = 'Connection closed before establishing link with server.';
          this.updateStatus('disconnected', msg);
          reject(new Error(msg));
          return;
        }

        this.connectPromise = null;
        if (this.status !== 'error') {
          this.updateStatus('disconnected', 'Disconnected from multiplayer server');
        }

        // Auto-reconnect if we were in an active room
        if (this.currentRoom) {
          this.scheduleReconnect();
        }
      };
    });

    return this.connectPromise;
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
    this.emit('onConnectionStatusChange', newStatus, message);
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
          this.emit('onPingUpdate', this.currentPing);
        }
        break;
      }

      case 'room_created':
        this.currentRoom = msg.room;
        this.isHost = true;
        this.sessionId = msg.sessionId;
        console.log(`[MultiplayerClient] Room created successfully: ${msg.room.roomCode}`);
        this.emit('onRoomCreated', msg.room);
        break;

      case 'room_joined':
        this.currentRoom = msg.room;
        this.isHost = msg.room.hostSessionId === msg.sessionId;
        this.sessionId = msg.sessionId;
        console.log(`[MultiplayerClient] Room joined successfully: ${msg.room.roomCode}`);
        this.emit('onRoomJoined', msg.room);
        break;

      case 'room_update':
        this.currentRoom = msg.room;
        if (this.sessionId) {
          this.isHost = msg.room.hostSessionId === this.sessionId;
        }
        this.emit('onRoomUpdated', msg.room);
        break;

      case 'character_changed':
        if (this.currentRoom && this.currentRoom.players[msg.sessionId]) {
          this.currentRoom.players[msg.sessionId].characterId = msg.characterId;
        }
        if (this.sessionId === msg.sessionId) {
          this.myCharacterId = msg.characterId;
        }
        this.emit('onCharacterChanged', msg.sessionId, msg.characterId);
        if (this.currentRoom) {
          this.emit('onRoomUpdated', this.currentRoom);
        }
        break;

      case 'player_joined':
        if (this.currentRoom) {
          this.currentRoom.players[msg.player.sessionId] = msg.player;
        }
        this.emit('onPlayerJoined', msg.player);
        break;

      case 'player_left':
        if (msg.sessionId === this.sessionId) {
          // I left the room
          this.currentRoom = null;
          this.isHost = false;
        } else if (this.currentRoom) {
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
        this.emit('onPlayerLeft', msg.sessionId, msg.newHostId);
        break;

      case 'game_started':
        this.currentRoom = msg.room;
        this.emit('onGameStarted', msg.room);
        break;

      case 'players_sync':
        this.emit('onPlayersSync', msg.players);
        break;

      case 'remote_shoot':
        this.emit('onRemoteShoot', msg);
        break;

      case 'creature_damaged':
        this.emit('onCreatureDamaged', msg);
        break;

      case 'chat_broadcast':
        this.emit('onChat', msg.senderName, msg.text);
        break;

      case 'error':
        console.error(`[MultiplayerClient] Server error [${msg.code}]:`, msg.message);
        this.emit('onError', msg.message, msg.code);
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
    } else {
      console.warn('[MultiplayerClient] Cannot send message, socket is not OPEN (readyState:', this.socket?.readyState, ')');
    }
  }

  // Action methods with timeout promises
  public async createRoom(
    playerName: string,
    characterId: HumanCharacterId,
    mode: GameMode,
    forestType: ForestType,
    difficulty: Difficulty,
    timeoutMs: number = 7000
  ): Promise<MultiplayerRoom> {
    await this.connect();

    return new Promise<MultiplayerRoom>((resolve, reject) => {
      let timer: number | null = null;
      let cleanup: (() => void) | null = null;

      const handleCreated = (room: MultiplayerRoom) => {
        if (timer) window.clearTimeout(timer);
        cleanup?.();
        resolve(room);
      };

      const handleError = (msg: string) => {
        if (timer) window.clearTimeout(timer);
        cleanup?.();
        reject(new Error(msg));
      };

      cleanup = () => {
        this.removeListener('onRoomCreated', handleCreated);
        this.removeListener('onError', handleError);
      };

      this.addListener('onRoomCreated', handleCreated);
      this.addListener('onError', handleError);

      timer = window.setTimeout(() => {
        cleanup?.();
        reject(new Error('Room creation timed out. The server did not respond. Please retry.'));
      }, timeoutMs);

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
    });
  }

  public async joinRoom(
    roomCode: string,
    playerName: string,
    characterId: HumanCharacterId,
    timeoutMs: number = 7000
  ): Promise<MultiplayerRoom> {
    await this.connect();

    return new Promise<MultiplayerRoom>((resolve, reject) => {
      let timer: number | null = null;
      let cleanup: (() => void) | null = null;

      const handleJoined = (room: MultiplayerRoom) => {
        if (timer) window.clearTimeout(timer);
        cleanup?.();
        resolve(room);
      };

      const handleError = (msg: string) => {
        if (timer) window.clearTimeout(timer);
        cleanup?.();
        reject(new Error(msg));
      };

      cleanup = () => {
        this.removeListener('onRoomJoined', handleJoined);
        this.removeListener('onError', handleError);
      };

      this.addListener('onRoomJoined', handleJoined);
      this.addListener('onError', handleError);

      timer = window.setTimeout(() => {
        cleanup?.();
        reject(new Error('Joining room timed out. Please check your room code and retry.'));
      }, timeoutMs);

      this.myPlayerName = playerName;
      this.myCharacterId = characterId;

      this.send({
        type: 'join_room',
        roomCode: roomCode.trim().toUpperCase(),
        playerName,
        characterId
      });
    });
  }

  public changeCharacter(characterId: HumanCharacterId) {
    this.myCharacterId = characterId;

    if (this.currentRoom && this.sessionId && this.currentRoom.players[this.sessionId]) {
      this.currentRoom.players[this.sessionId].characterId = characterId;
      this.emit('onRoomUpdated', this.currentRoom);
    }

    this.send({
      type: 'change_character',
      characterId
    });
  }

  public leaveRoom() {
    this.send({ type: 'leave_room' });
    this.currentRoom = null;
    this.isHost = false;
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.stopHeartbeat();
    this.leaveRoom();

    if (this.socket) {
      try {
        this.socket.onopen = null;
        this.socket.onmessage = null;
        this.socket.onerror = null;
        this.socket.onclose = null;
        this.socket.close();
      } catch {}
      this.socket = null;
    }

    this.status = 'disconnected';
    this.connectPromise = null;
    this.callbacks = {};
    this.listeners = {};
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
