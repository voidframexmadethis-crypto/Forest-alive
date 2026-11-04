import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { ClientMessage, MultiplayerRoom, NetworkPlayer, ServerMessage } from './src/types/multiplayer';
import { HumanCharacterId } from './src/game/characterMesh';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// In-memory Room State
const rooms = new Map<string, MultiplayerRoom>();
const clientToSession = new Map<WebSocket, { roomId: string; playerId: string }>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function sendTo(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcastToRoom(roomId: string, message: ServerMessage, excludeWs?: WebSocket) {
  const room = rooms.get(roomId);
  if (!room) return;

  clientToSession.forEach((session, ws) => {
    if (session.roomId === roomId && ws !== excludeWs) {
      sendTo(ws, message);
    }
  });
}

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (raw: string) => {
    try {
      const msg: ClientMessage = JSON.parse(raw.toString());

      if (msg.type === 'ping') {
        sendTo(ws, { type: 'pong', timestamp: msg.timestamp });
        return;
      }

      if (msg.type === 'create_room') {
        const code = generateRoomCode();
        const playerId = 'player_' + Math.random().toString(36).substring(2, 9);
        const hostPlayer: NetworkPlayer = {
          id: playerId,
          name: msg.name || 'Survivor 1',
          characterId: msg.characterId || 'titan',
          isReady: false,
          isHost: true,
          ping: 0,
          position: { x: 0, y: 1.7, z: 0 },
          rotation: { yaw: 0, pitch: 0, roll: 0 },
          stance: 'standing',
          isAiming: false,
          isShooting: false,
          isReloading: false,
          weaponId: 'm4a1',
          health: 100,
          maxHealth: 100,
          isDowned: false,
          isDead: false,
          kills: 0
        };

        const newRoom: MultiplayerRoom = {
          code,
          hostId: playerId,
          maxPlayers: 5,
          mode: msg.mode || 'blood_harvest',
          forestType: msg.forestType || 'pine_dark',
          difficulty: msg.difficulty || 'realism',
          status: 'lobby',
          players: { [playerId]: hostPlayer },
          createdAt: Date.now(),
          successionEventComplete: false,
          completedMissions: 0,
          currentMission: 1,
          isCampaignComplete: false,
          natashaSkillLevel: 0
        };

        rooms.set(code, newRoom);
        clientToSession.set(ws, { roomId: code, playerId });

        sendTo(ws, { type: 'room_created', room: newRoom, playerId });
        return;
      }

      if (msg.type === 'join_room') {
        const cleanCode = msg.code.trim().toUpperCase();
        const room = rooms.get(cleanCode);

        if (!room) {
          sendTo(ws, { type: 'error', message: `Room ${cleanCode} not found.` });
          return;
        }

        const currentCount = Object.keys(room.players).length;
        if (currentCount >= room.maxPlayers) {
          sendTo(ws, { type: 'error', message: `Room ${cleanCode} is full (maximum 5 survivors).` });
          return;
        }

        if (room.status !== 'lobby') {
          sendTo(ws, { type: 'error', message: `Mission in progress in room ${cleanCode}. Cannot join.` });
          return;
        }

        // Determine available character
        const availableCharacters: HumanCharacterId[] = ['titan', 'katrina', 'natasha', 'bill', 'luis'];
        const takenCharacters = new Set(Object.values(room.players).map((p) => p.characterId));
        let chosenCharacter: HumanCharacterId | null = null;

        if (msg.characterId && !takenCharacters.has(msg.characterId)) {
          chosenCharacter = msg.characterId;
        } else {
          chosenCharacter = availableCharacters.find((c) => !takenCharacters.has(c)) || null;
        }

        const playerId = 'player_' + Math.random().toString(36).substring(2, 9);
        const newPlayer: NetworkPlayer = {
          id: playerId,
          name: msg.name || `Survivor ${currentCount + 1}`,
          characterId: chosenCharacter,
          isReady: false,
          isHost: false,
          ping: 0,
          position: { x: (currentCount - 2) * 2, y: 1.7, z: 0 },
          rotation: { yaw: 0, pitch: 0, roll: 0 },
          stance: 'standing',
          isAiming: false,
          isShooting: false,
          isReloading: false,
          weaponId: 'm4a1',
          health: 100,
          maxHealth: 100,
          isDowned: false,
          isDead: false,
          kills: 0
        };

        room.players[playerId] = newPlayer;
        clientToSession.set(ws, { roomId: cleanCode, playerId });

        sendTo(ws, { type: 'room_joined', room, playerId });
        broadcastToRoom(cleanCode, { type: 'room_update', room }, ws);
        return;
      }

      // Remaining messages require an active session
      const session = clientToSession.get(ws);
      if (!session) return;

      const room = rooms.get(session.roomId);
      if (!room) return;

      const player = room.players[session.playerId];
      if (!player) return;

      if (msg.type === 'select_character') {
        const targetChar = msg.characterId;
        // Verify character uniqueness across room
        const isTaken = Object.entries(room.players).some(
          ([pId, p]) => pId !== session.playerId && p.characterId === targetChar
        );

        if (isTaken) {
          sendTo(ws, { type: 'error', message: 'That character is already selected by another survivor!' });
          return;
        }

        player.characterId = targetChar;
        broadcastToRoom(session.roomId, { type: 'room_update', room });
        return;
      }

      if (msg.type === 'toggle_ready') {
        player.isReady = msg.isReady;
        broadcastToRoom(session.roomId, { type: 'room_update', room });
        return;
      }

      if (msg.type === 'start_game') {
        if (!player.isHost) {
          sendTo(ws, { type: 'error', message: 'Only the room host can launch the cooperative mission.' });
          return;
        }

        // Verify all players have selected a character
        const allHaveCharacter = Object.values(room.players).every((p) => p.characterId !== null);
        if (!allHaveCharacter) {
          sendTo(ws, { type: 'error', message: 'All survivors must select a character before deployment.' });
          return;
        }

        room.status = 'in_game';
        broadcastToRoom(session.roomId, { type: 'game_started', room });
        return;
      }

      if (msg.type === 'player_update') {
        Object.assign(player, msg.data);
        broadcastToRoom(session.roomId, {
          type: 'player_update',
          playerId: session.playerId,
          data: msg.data
        }, ws);
        return;
      }

      if (msg.type === 'shoot_bullet') {
        broadcastToRoom(session.roomId, {
          type: 'bullet_fired',
          playerId: session.playerId,
          origin: msg.origin,
          direction: msg.direction,
          weaponId: msg.weaponId,
          hitPoint: msg.hitPoint
        }, ws);
        return;
      }

      if (msg.type === 'sync_creatures') {
        // Broadcast authoritative creature states from host to all other clients
        if (player.isHost) {
          broadcastToRoom(session.roomId, {
            type: 'creatures_synced',
            creatures: msg.creatures
          }, ws);
        }
        return;
      }

      if (msg.type === 'creature_damage') {
        broadcastToRoom(session.roomId, {
          type: 'creature_damage',
          playerId: session.playerId,
          creatureId: msg.creatureId,
          damage: msg.damage,
          hitLocation: msg.hitLocation
        }, ws);
        return;
      }

      if (msg.type === 'story_event_trigger') {
        if (msg.event === 'katrina_labor') {
          room.successionEventComplete = true;
          broadcastToRoom(session.roomId, { type: 'story_event_triggered', event: 'katrina_labor' });
          broadcastToRoom(session.roomId, { type: 'room_update', room });
        }
        return;
      }

      if (msg.type === 'complete_mission') {
        room.completedMissions += 1;
        room.currentMission += 1;
        room.natashaSkillLevel = Math.min(5, room.completedMissions);
        
        // Trigger labor if progress reaches threshold (5 missions)
        if (room.completedMissions >= 5 && !room.successionEventComplete) {
          broadcastToRoom(session.roomId, { type: 'story_event_triggered', event: 'katrina_labor' });
          room.successionEventComplete = true;
        }

        // Campaign completion (total missions: 5 standard + 3 final = 8)
        if (room.completedMissions >= 8) {
          room.isCampaignComplete = true;
          broadcastToRoom(session.roomId, { type: 'story_event_triggered', event: 'campaign_complete' });
        }
        
        broadcastToRoom(session.roomId, { type: 'room_update', room });
        return;
      }

      if (msg.type === 'revive_player') {
        const target = room.players[msg.targetPlayerId];
        if (target && target.isDowned) {
          target.isDowned = false;
          target.health = 50; // Revived with 50 health
          broadcastToRoom(session.roomId, {
            type: 'player_revived',
            reviverId: session.playerId,
            targetId: msg.targetPlayerId
          });
          broadcastToRoom(session.roomId, { type: 'room_update', room });
        }
        return;
      }

      if (msg.type === 'leave_room') {
        handleDisconnect(ws);
      }

    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    handleDisconnect(ws);
  });
});

function handleDisconnect(ws: WebSocket) {
  const session = clientToSession.get(ws);
  if (!session) return;

  clientToSession.delete(ws);
  const room = rooms.get(session.roomId);
  if (!room) return;

  delete room.players[session.playerId];
  const remainingPlayers = Object.keys(room.players);

  if (remainingPlayers.length === 0) {
    rooms.delete(session.roomId);
  } else {
    // Reassign host if the host disconnected
    if (room.hostId === session.playerId) {
      room.hostId = remainingPlayers[0];
      room.players[remainingPlayers[0]].isHost = true;
    }
    broadcastToRoom(session.roomId, { type: 'room_update', room });
  }
}

// REST endpoints for health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: rooms.size });
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`[Forest Alive Server] Running on http://0.0.0.0:${port} with Real-Time Multiplayer WebSockets`);
  });
}

start();
