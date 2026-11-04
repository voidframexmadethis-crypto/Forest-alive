import { ClientMessage, MultiplayerRoom, NetworkPlayer, ServerMessage, SyncedCreature } from '../../types/multiplayer';
import { HumanCharacterId } from '../characterMesh';
import { Difficulty, ForestType, GameMode } from '../../types/game';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface NetworkClientListeners {
  onConnectionChange?: (status: ConnectionStatus) => void;
  onRoomCreated?: (room: MultiplayerRoom, playerId: string) => void;
  onRoomJoined?: (room: MultiplayerRoom, playerId: string) => void;
  onRoomUpdate?: (room: MultiplayerRoom) => void;
  onGameStarted?: (room: MultiplayerRoom) => void;
  onPlayerUpdate?: (playerId: string, data: Partial<NetworkPlayer>) => void;
  onBulletFired?: (playerId: string, origin: { x: number; y: number; z: number }, direction: { x: number; y: number; z: number }, weaponId: string, hitPoint?: { x: number; y: number; z: number }) => void;
  onCreaturesSynced?: (creatures: SyncedCreature[]) => void;
  onCreatureDamage?: (creatureId: string, damage: number, playerId: string) => void;
  onPlayerDowned?: (playerId: string, playerName: string, characterId: string) => void;
  onPlayerRevived?: (reviverId: string, targetId: string) => void;
  onError?: (message: string) => void;
  onPingUpdate?: (pingMs: number) => void;
}

export class NetworkClient {
  private static instance: NetworkClient | null = null;
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private listeners: NetworkClientListeners = {};
  public currentRoom: MultiplayerRoom | null = null;
  public localPlayerId: string | null = null;
  private pingInterval: number | null = null;
  private pingStart: number = 0;
  public currentPing: number = 0;

  public static getInstance(): NetworkClient {
    if (!NetworkClient.instance) {
      NetworkClient.instance = new NetworkClient();
    }
    return NetworkClient.instance;
  }

  public setListeners(listeners: NetworkClientListeners) {
    this.listeners = { ...this.listeners, ...listeners };
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public connect(): Promise<boolean> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve(true);
    }

    this.setStatus('connecting');

    return new Promise((resolve) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.setStatus('connected');
          this.startPingLoop();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.handleServerMessage(event.data);
        };

        this.ws.onerror = (err) => {
          console.error('[NetworkClient] WebSocket error state:', this.ws?.readyState, err);
          this.setStatus('error');
          this.listeners.onError?.('Network connection failed. Check server status.');
          resolve(false);
        };

        this.ws.onclose = () => {
          this.setStatus('disconnected');
          this.stopPingLoop();
          this.currentRoom = null;
        };
      } catch (err) {
        console.error('[NetworkClient] Failed to create WebSocket:', err);
        this.setStatus('error');
        resolve(false);
      }
    });
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.listeners.onConnectionChange?.(status);
  }

  private startPingLoop() {
    this.stopPingLoop();
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.pingStart = performance.now();
        this.send({ type: 'ping', timestamp: this.pingStart });
      }
    }, 2500);
  }

  private stopPingLoop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private send(message: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleServerMessage(dataStr: string) {
    try {
      const msg: ServerMessage = JSON.parse(dataStr);

      if (msg.type === 'pong') {
        const now = performance.now();
        this.currentPing = Math.round(now - this.pingStart);
        this.listeners.onPingUpdate?.(this.currentPing);
        return;
      }

      if (msg.type === 'room_created') {
        this.currentRoom = msg.room;
        this.localPlayerId = msg.playerId;
        this.listeners.onRoomCreated?.(msg.room, msg.playerId);
        return;
      }

      if (msg.type === 'room_joined') {
        this.currentRoom = msg.room;
        this.localPlayerId = msg.playerId;
        this.listeners.onRoomJoined?.(msg.room, msg.playerId);
        return;
      }

      if (msg.type === 'room_update') {
        this.currentRoom = msg.room;
        this.listeners.onRoomUpdate?.(msg.room);
        return;
      }

      if (msg.type === 'game_started') {
        this.currentRoom = msg.room;
        this.listeners.onGameStarted?.(msg.room);
        return;
      }

      if (msg.type === 'player_update') {
        this.listeners.onPlayerUpdate?.(msg.playerId, msg.data);
        return;
      }

      if (msg.type === 'bullet_fired') {
        this.listeners.onBulletFired?.(msg.playerId, msg.origin, msg.direction, msg.weaponId, msg.hitPoint);
        return;
      }

      if (msg.type === 'creatures_synced') {
        this.listeners.onCreaturesSynced?.(msg.creatures);
        return;
      }

      if (msg.type === 'creature_damage') {
        this.listeners.onCreatureDamage?.(msg.creatureId, msg.damage, msg.playerId);
        return;
      }

      if (msg.type === 'player_downed') {
        this.listeners.onPlayerDowned?.(msg.playerId, msg.playerName, msg.characterId);
        return;
      }

      if (msg.type === 'player_revived') {
        this.listeners.onPlayerRevived?.(msg.reviverId, msg.targetId);
        return;
      }

      if (msg.type === 'error') {
        this.listeners.onError?.(msg.message);
        return;
      }
    } catch (err) {
      console.error('[NetworkClient] Message parsing failed:', err);
    }
  }

  // --- ACTIONS ---

  public createRoom(name: string, characterId: HumanCharacterId, mode: GameMode, forestType: ForestType, difficulty: Difficulty) {
    this.send({
      type: 'create_room',
      name,
      characterId,
      mode,
      forestType,
      difficulty
    });
  }

  public joinRoom(code: string, name: string, characterId?: HumanCharacterId) {
    this.send({
      type: 'join_room',
      code,
      name,
      characterId
    });
  }

  public selectCharacter(characterId: HumanCharacterId) {
    this.send({
      type: 'select_character',
      characterId
    });
  }

  public toggleReady(isReady: boolean) {
    this.send({
      type: 'toggle_ready',
      isReady
    });
  }

  public startGame() {
    this.send({
      type: 'start_game'
    });
  }

  public sendPlayerUpdate(data: Partial<NetworkPlayer>) {
    this.send({
      type: 'player_update',
      data
    });
  }

  public sendBulletFired(origin: { x: number; y: number; z: number }, direction: { x: number; y: number; z: number }, weaponId: string, hitPoint?: { x: number; y: number; z: number }) {
    this.send({
      type: 'shoot_bullet',
      origin,
      direction,
      weaponId,
      hitPoint
    });
  }

  public syncCreatures(creatures: SyncedCreature[]) {
    this.send({
      type: 'sync_creatures',
      creatures
    });
  }

  public sendCreatureDamage(creatureId: string, damage: number, hitLocation?: string) {
    this.send({
      type: 'creature_damage',
      creatureId,
      damage,
      hitLocation
    });
  }

  public revivePlayer(targetPlayerId: string) {
    this.send({
      type: 'revive_player',
      targetPlayerId
    });
  }

  public triggerStoryEvent(event: 'katrina_labor') {
    this.send({
      type: 'story_event_trigger',
      event
    });
  }

  public completeMission() {
    this.send({
      type: 'complete_mission'
    });
  }

  public leaveRoom() {
    this.send({
      type: 'leave_room'
    });
    this.currentRoom = null;
    this.localPlayerId = null;
  }

  public disconnect() {
    this.stopPingLoop();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
    this.currentRoom = null;
    this.localPlayerId = null;
  }
}

export const networkClient = NetworkClient.getInstance();
