import express from 'express';
import type { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import type {
  ClientToServerMessage,
  MultiplayerPlayer,
  MultiplayerRoom,
  ServerToClientMessage
} from './src/types/multiplayer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// In-memory Room & Client State
interface ClientConnection {
  ws: WebSocket;
  sessionId: string;
  roomCode: string | null;
  playerName: string;
  isAlive: boolean;
}

const clients = new Map<string, ClientConnection>(); // sessionId -> connection
const wsToSession = new Map<WebSocket, string>(); // ws -> sessionId
const rooms = new Map<string, MultiplayerRoom>();

// 6-character room code generator (excludes easily confused letters/numbers: 0, O, 1, I)
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateRoomCode(): string {
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

// Helper to send typed message to a specific client
function sendToClient(ws: WebSocket, msg: ServerToClientMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(msg));
    } catch (err) {
      console.error('Failed to send to client:', err);
    }
  }
}

// Helper to broadcast to all clients in a specific room
function broadcastToRoom(
  roomCode: string,
  msg: ServerToClientMessage,
  excludeSessionId?: string
) {
  const room = rooms.get(roomCode);
  if (!room) return;

  Object.keys(room.players).forEach((sessionId) => {
    if (excludeSessionId && sessionId === excludeSessionId) return;
    const client = clients.get(sessionId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      sendToClient(client.ws, msg);
    }
  });
}

// Clean up player leaving or disconnecting from a room
function handlePlayerLeaveRoom(sessionId: string) {
  const client = clients.get(sessionId);
  if (!client || !client.roomCode) return;

  const roomCode = client.roomCode;
  const room = rooms.get(roomCode);
  client.roomCode = null;

  if (!room) return;

  const leavingPlayer = room.players[sessionId];
  delete room.players[sessionId];

  const remainingSessionIds = Object.keys(room.players);
  if (remainingSessionIds.length === 0) {
    // Room is empty, clean it up completely
    rooms.delete(roomCode);
    console.log(`[Multiplayer] Room ${roomCode} was deleted (empty). Active rooms: ${rooms.size}`);
  } else {
    // Reassign host if leaving player was host
    let newHostId: string | undefined;
    if (room.hostSessionId === sessionId) {
      newHostId = remainingSessionIds[0];
      room.hostSessionId = newHostId;
      room.players[newHostId].isHost = true;
      console.log(`[Multiplayer] Host of room ${roomCode} reassigned to ${room.players[newHostId].name} (${newHostId})`);
    }

    broadcastToRoom(roomCode, {
      type: 'player_left',
      sessionId,
      newHostId
    });

    broadcastToRoom(roomCode, {
      type: 'room_update',
      room
    });
  }
}

// WebSocket Server initialization
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws: WebSocket, request) => {
  const sessionId = 'session_' + crypto.randomUUID().slice(0, 8);
  const client: ClientConnection = {
    ws,
    sessionId,
    roomCode: null,
    playerName: 'Survivor',
    isAlive: true
  };

  clients.set(sessionId, client);
  wsToSession.set(ws, sessionId);

  console.log(`[Multiplayer] Client connected: ${sessionId} (Total online: ${clients.size})`);

  // Send connection ack with their unique session identifier
  sendToClient(ws, {
    type: 'connected',
    sessionId
  });

  ws.on('pong', () => {
    client.isAlive = true;
  });

  ws.on('message', (data: string | Buffer) => {
    try {
      const msg: ClientToServerMessage = JSON.parse(data.toString());

      switch (msg.type) {
        case 'ping': {
          sendToClient(ws, {
            type: 'pong',
            timestamp: msg.timestamp
          });
          break;
        }

        case 'create_room': {
          // If already in a room, leave it first
          if (client.roomCode) {
            handlePlayerLeaveRoom(sessionId);
          }

          const roomCode = generateRoomCode();
          client.playerName = msg.playerName.trim() || 'Survivor';
          client.roomCode = roomCode;

          const newPlayer: MultiplayerPlayer = {
            sessionId,
            name: client.playerName,
            characterId: msg.characterId || 'titan',
            isHost: true,
            ping: 0,
            pos: { x: 0, y: 0, z: 0 },
            yaw: 0,
            pitch: 0,
            stance: 'standing',
            isSprinting: false,
            currentWeapon: 'm4a1',
            health: 100,
            maxHealth: 100,
            lastUpdate: Date.now()
          };

          const room: MultiplayerRoom = {
            roomCode,
            hostSessionId: sessionId,
            players: { [sessionId]: newPlayer },
            mode: msg.mode || 'blood_harvest',
            forestType: msg.forestType || 'pine_dark',
            difficulty: msg.difficulty || 'realism',
            status: 'lobby',
            createdAt: Date.now()
          };

          rooms.set(roomCode, room);

          console.log(`[Multiplayer] Room created: ${roomCode} by ${client.playerName} (${sessionId}). Active rooms: ${rooms.size}`);

          sendToClient(ws, {
            type: 'room_created',
            room,
            sessionId
          });
          break;
        }

        case 'join_room': {
          const code = (msg.roomCode || '').toUpperCase().trim();
          if (!code || code.length !== 6) {
            sendToClient(ws, {
              type: 'error',
              code: 'INVALID_CODE',
              message: 'Invalid room code format. Must be a 6-character code.'
            });
            return;
          }

          const room = rooms.get(code);
          if (!room) {
            sendToClient(ws, {
              type: 'error',
              code: 'ROOM_NOT_FOUND',
              message: `Room "${code}" not found. Verify the code or create a new room.`
            });
            return;
          }

          // Check max capacity (4 players max)
          const currentCount = Object.keys(room.players).length;
          if (currentCount >= 4) {
            sendToClient(ws, {
              type: 'error',
              code: 'ROOM_FULL',
              message: `Room "${code}" is already full (4/4 players).`
            });
            return;
          }

          // Check if game already in progress
          if (room.status === 'playing') {
            sendToClient(ws, {
              type: 'error',
              code: 'GAME_IN_PROGRESS',
              message: `Room "${code}" has already deployed into combat.`
            });
            return;
          }

          // If already in another room, leave first
          if (client.roomCode && client.roomCode !== code) {
            handlePlayerLeaveRoom(sessionId);
          }

          client.playerName = msg.playerName.trim() || `Survivor #${currentCount + 1}`;
          client.roomCode = code;

          const joinedPlayer: MultiplayerPlayer = {
            sessionId,
            name: client.playerName,
            characterId: msg.characterId || 'katrina',
            isHost: false,
            ping: 0,
            pos: { x: currentCount * 2.5 - 2, y: 0, z: 0 },
            yaw: 0,
            pitch: 0,
            stance: 'standing',
            isSprinting: false,
            currentWeapon: 'm4a1',
            health: 100,
            maxHealth: 100,
            lastUpdate: Date.now()
          };

          room.players[sessionId] = joinedPlayer;

          console.log(`[Multiplayer] Player ${client.playerName} (${sessionId}) joined room ${code}. Total players: ${Object.keys(room.players).length}`);

          // Notify joined client with full room state
          sendToClient(ws, {
            type: 'room_joined',
            room,
            sessionId
          });

          // Notify other players in the room
          broadcastToRoom(code, {
            type: 'player_joined',
            player: joinedPlayer
          }, sessionId);

          broadcastToRoom(code, {
            type: 'room_update',
            room
          });
          break;
        }

        case 'leave_room': {
          handlePlayerLeaveRoom(sessionId);
          break;
        }

        case 'start_game': {
          if (!client.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room) return;

          // Only host can start game
          if (room.hostSessionId !== sessionId) {
            sendToClient(ws, {
              type: 'error',
              code: 'NOT_HOST',
              message: 'Only the room host can launch the game.'
            });
            return;
          }

          room.status = 'playing';
          console.log(`[Multiplayer] Room ${room.roomCode} launched game!`);

          broadcastToRoom(room.roomCode, {
            type: 'game_started',
            room
          });
          break;
        }

        case 'player_update': {
          if (!client.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room) return;

          const player = room.players[sessionId];
          if (!player) return;

          player.pos = msg.pos;
          player.yaw = msg.yaw;
          player.pitch = msg.pitch;
          player.stance = msg.stance;
          player.isSprinting = msg.isSprinting;
          player.currentWeapon = msg.currentWeapon;
          player.health = msg.health;
          player.lastUpdate = Date.now();
          break;
        }

        case 'player_shoot': {
          if (!client.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room) return;

          // Broadcast shooting event and tracer to all other players in the room
          broadcastToRoom(
            client.roomCode,
            {
              type: 'remote_shoot',
              sessionId,
              playerName: client.playerName,
              origin: msg.origin,
              direction: msg.direction,
              weaponId: msg.weaponId,
              hitPoint: msg.hitPoint
            },
            sessionId
          );
          break;
        }

        case 'creature_damage': {
          if (!client.roomCode) return;
          const room = rooms.get(client.roomCode);
          if (!room) return;

          // Broadcast synchronized creature damage event
          broadcastToRoom(client.roomCode, {
            type: 'creature_damaged',
            creatureId: msg.creatureId,
            damage: msg.damage,
            attackerSessionId: sessionId,
            attackerName: client.playerName,
            isHeadshot: msg.isHeadshot
          });
          break;
        }

        case 'chat': {
          if (!client.roomCode) return;
          const text = (msg.text || '').trim();
          if (!text) return;

          broadcastToRoom(client.roomCode, {
            type: 'chat_broadcast',
            senderName: client.playerName,
            text,
            timestamp: Date.now()
          });
          break;
        }
      }
    } catch (err) {
      console.error(`[Multiplayer] Error processing message from ${sessionId}:`, err);
    }
  });

  ws.on('close', () => {
    console.log(`[Multiplayer] Client disconnected: ${sessionId}`);
    handlePlayerLeaveRoom(sessionId);
    clients.delete(sessionId);
    wsToSession.delete(ws);
  });

  ws.on('error', (err) => {
    console.error(`[Multiplayer] WebSocket error for ${sessionId}:`, err);
  });
});

// Upgrade handling for HTTP -> WS connection
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Ignore Vite's internal HMR web socket protocol if present
  if (request.headers['sec-websocket-protocol'] === 'vite-hmr') {
    return;
  }

  // Accept connections to /ws or root /
  if (pathname === '/ws' || pathname === '/ws/' || pathname === '/') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

// Periodic 20 Hz synchronization tick for player positions (50ms)
setInterval(() => {
  rooms.forEach((room) => {
    if (room.status === 'playing') {
      const playerCount = Object.keys(room.players).length;
      if (playerCount > 1) {
        broadcastToRoom(room.roomCode, {
          type: 'players_sync',
          players: room.players
        });
      }
    }
  });
}, 50);

// Heartbeat interval to prune dead connections (every 15s)
setInterval(() => {
  clients.forEach((client, sessionId) => {
    if (!client.isAlive) {
      console.log(`[Multiplayer] Terminating inactive socket: ${sessionId}`);
      client.ws.terminate();
      handlePlayerLeaveRoom(sessionId);
      clients.delete(sessionId);
      wsToSession.delete(client.ws);
      return;
    }
    client.isAlive = false;
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.ping();
    }
  });
}, 15000);

// REST API Endpoints
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    game: 'FOREST ALIVE',
    multiplayer: true,
    totalOnline: clients.size,
    activeRooms: rooms.size,
    timestamp: Date.now()
  });
});

app.get('/api/multiplayer/rooms', (req: Request, res: Response) => {
  const publicRooms = Array.from(rooms.values()).map((r) => ({
    roomCode: r.roomCode,
    playerCount: Object.keys(r.players).length,
    mode: r.mode,
    forestType: r.forestType,
    status: r.status,
    createdAt: r.createdAt
  }));
  res.json({ rooms: publicRooms });
});

// Serve frontend assets based on environment
async function setupFrontend() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Development mode: attach Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }
}

setupFrontend().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(`  🌲 FOREST ALIVE MULTIPLAYER SERVER ONLINE`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  WebSocket Endpoint: /ws`);
    console.log(`===================================================`);
  });
});
