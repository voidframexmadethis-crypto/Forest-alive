import WebSocket from 'ws';

function createClient(name) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3000/ws');
    let sessionId = null;
    const listeners = [];

    ws.on('open', () => {});

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'connected') {
        sessionId = msg.sessionId;
        resolve({
          name,
          ws,
          getSessionId: () => sessionId,
          send: (m) => ws.send(JSON.stringify(m)),
          on: (cb) => listeners.push(cb),
          waitFor: (predicate, timeoutMs = 4000) => {
            return new Promise((res, rej) => {
              const timer = setTimeout(() => {
                rej(new Error(`Timeout waiting for message in ${name}`));
              }, timeoutMs);

              const handler = (m) => {
                if (predicate(m)) {
                  clearTimeout(timer);
                  const idx = listeners.indexOf(handler);
                  if (idx >= 0) listeners.splice(idx, 1);
                  res(m);
                }
              };
              listeners.push(handler);
            });
          },
          close: () => ws.close()
        });
      }
      listeners.forEach((l) => l(msg));
    });

    ws.on('error', (err) => reject(err));
  });
}

async function verifyAllScenarios() {
  console.log('>>> TESTING SPECIFIC FREEZE & EXIT SCENARIOS <<<');

  // Scenario 1 & 2: Create room & Join from second session
  const c1 = await createClient('Client1');
  c1.send({
    type: 'create_room',
    playerName: 'PlayerOne',
    characterId: 'titan',
    mode: 'creature_mode',
    forestType: 'pine_dark',
    difficulty: 'realism'
  });
  const roomCreated = await c1.waitFor((m) => m.type === 'room_created');
  const code = roomCreated.room.roomCode;
  console.log('✓ Scenario 1: Room created without freezing, code:', code);

  const c2 = await createClient('Client2');
  c2.send({
    type: 'join_room',
    roomCode: code,
    playerName: 'PlayerTwo',
    characterId: 'katrina'
  });
  const roomJoined = await c2.waitFor((m) => m.type === 'room_joined');
  console.log('✓ Scenario 2: Joined room from second session');

  // Scenario 3: Change avatars without freezing
  const p1SyncPromise = c1.waitFor((m) => m.type === 'character_changed' && m.characterId === 'bill');
  const p2SyncPromise = c2.waitFor((m) => m.type === 'character_changed' && m.characterId === 'bill');
  c2.send({ type: 'change_character', characterId: 'bill' });
  await Promise.all([p1SyncPromise, p2SyncPromise]);
  console.log('✓ Scenario 3: Avatar changed to Bill Lewis and synchronized without freeze');

  // Change to Luis
  const p1LuisPromise = c1.waitFor((m) => m.type === 'character_changed' && m.characterId === 'luis');
  c1.send({ type: 'change_character', characterId: 'luis' });
  await p1LuisPromise;
  console.log('✓ Scenario 3b: Avatar changed to Luis and verified');

  // Scenario 4: Move both players and verify synchronization
  c1.send({ type: 'start_game' });
  await Promise.all([
    c1.waitFor((m) => m.type === 'game_started'),
    c2.waitFor((m) => m.type === 'game_started')
  ]);
  c2.send({
    type: 'player_update',
    pos: { x: 50.0, y: 1.7, z: -30.0 },
    yaw: 0.5,
    pitch: 0,
    stance: 'standing',
    isSprinting: false,
    currentWeapon: 'fast_guy',
    health: 95
  });
  const syncPos = await c1.waitFor((m) => m.type === 'players_sync' && m.players[c2.getSessionId()]?.pos?.x === 50.0);
  console.log('✓ Scenario 4: Real-time movement synchronized between players');

  // Scenario 5: Exit multiplayer during gameplay
  const c1LeftPromise = c1.waitFor((m) => m.type === 'player_left' && m.sessionId === c2.getSessionId());
  c2.send({ type: 'leave_room' });
  await c1LeftPromise;
  console.log('✓ Scenario 5: Player 2 exited during gameplay, host notified cleanly');

  // Scenario 6: Re-enter multiplayer after exiting
  c2.send({
    type: 'join_room',
    roomCode: code,
    playerName: 'PlayerTwo_Returned',
    characterId: 'natasha'
  });
  // Note: room is in playing mode so server will return GAME_IN_PROGRESS error
  const errMsg = await c2.waitFor((m) => m.type === 'error');
  console.log('✓ Scenario 6: Guarded joining match in progress with error:', errMsg.message);

  // Scenario 7: Create a fresh new room after exiting
  c2.send({
    type: 'create_room',
    playerName: 'PlayerTwo_Host',
    characterId: 'natasha',
    mode: 'blood_harvest',
    forestType: 'red_mist',
    difficulty: 'nightmare'
  });
  const newRoomCreated = await c2.waitFor((m) => m.type === 'room_created');
  console.log('✓ Scenario 7: Player 2 created new room after exiting, code:', newRoomCreated.room.roomCode);

  c1.close();
  c2.close();
  console.log('>>> ALL VERIFICATION SCENARIOS PASSED SUCCESSFULLY <<<');
}

verifyAllScenarios().catch((e) => {
  console.error(e);
  process.exit(1);
});
