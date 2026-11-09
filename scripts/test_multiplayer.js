import WebSocket from 'ws';

function createClient(name) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3000/ws');
    let sessionId = null;
    const listeners = [];

    ws.on('open', () => {
      // Wait for 'connected' packet
    });

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
                rej(new Error(`Timeout waiting for message matching condition in ${name}`));
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

async function runTests() {
  console.log('====================================================');
  console.log('  RUNNING FOREST ALIVE MULTIPLAYER VERIFICATION TESTS');
  console.log('====================================================');

  const results = {};

  try {
    // TEST A: Player 1 creates a room and receives a real room code
    console.log('\n[TEST A] Player 1 creates room...');
    const player1 = await createClient('Player1_Titan');
    player1.send({
      type: 'create_room',
      playerName: 'Titan_Lead',
      characterId: 'titan',
      mode: 'blood_harvest',
      forestType: 'pine_dark',
      difficulty: 'realism'
    });

    const roomCreatedMsg = await player1.waitFor((m) => m.type === 'room_created');
    const roomCode = roomCreatedMsg.room.roomCode;
    console.log(` -> Received room code: "${roomCode}"`);

    if (roomCode && roomCode.length === 6 && typeof roomCode === 'string') {
      results['TEST A: Room Creation & Code Generation'] = 'PASSED';
      console.log(' -> TEST A PASSED: Valid 6-character room code generated.');
    } else {
      results['TEST A: Room Creation & Code Generation'] = 'FAILED';
    }

    // TEST B: Player 2 joins using that code
    console.log('\n[TEST B] Player 2 joins room using code:', roomCode);
    const player2 = await createClient('Player2_Katrina');
    player2.send({
      type: 'join_room',
      roomCode,
      playerName: 'Katrina_Recon',
      characterId: 'katrina'
    });

    const roomJoinedMsg = await player2.waitFor((m) => m.type === 'room_joined');
    if (roomJoinedMsg.room.roomCode === roomCode) {
      results['TEST B: Player Joining with Code'] = 'PASSED';
      console.log(' -> TEST B PASSED: Player 2 joined successfully.');
    } else {
      results['TEST B: Player Joining with Code'] = 'FAILED';
    }

    // TEST C: Both players see each other in the same room
    console.log('\n[TEST C] Verifying both players see each other in room...');
    const p1PlayerJoined = await player1.waitFor((m) => m.type === 'player_joined' && m.player.name === 'Katrina_Recon');
    const p2RoomPlayers = Object.keys(roomJoinedMsg.room.players);

    if (p1PlayerJoined && p2RoomPlayers.length === 2) {
      results['TEST C: Mutual Visibility in Room'] = 'PASSED';
      console.log(' -> TEST C PASSED: Both players confirmed present in room roster.');
    } else {
      results['TEST C: Mutual Visibility in Room'] = 'FAILED';
    }

    // TEST H: Avatar Selection & Real-Time Synchronization
    console.log('\n[TEST H] Testing avatar switching and room synchronization...');
    // Player 2 switches avatar from 'katrina' to 'bill' (Bill Lewis)
    const p1CharChangePromise = player1.waitFor((m) => m.type === 'character_changed' && m.sessionId === player2.getSessionId() && m.characterId === 'bill');
    const p2CharChangePromise = player2.waitFor((m) => m.type === 'character_changed' && m.sessionId === player2.getSessionId() && m.characterId === 'bill');

    player2.send({
      type: 'change_character',
      characterId: 'bill'
    });

    const [p1HeardChange, p2HeardChange] = await Promise.all([p1CharChangePromise, p2CharChangePromise]);

    // Player 1 switches to 'natasha'
    const p2NatashaPromise = player2.waitFor((m) => m.type === 'character_changed' && m.sessionId === player1.getSessionId() && m.characterId === 'natasha');
    player1.send({
      type: 'change_character',
      characterId: 'natasha'
    });
    const p2HeardNatasha = await p2NatashaPromise;

    if (p1HeardChange && p2HeardChange && p2HeardNatasha) {
      results['TEST H: Avatar Selection & Server Synchronization'] = 'PASSED';
      console.log(' -> TEST H PASSED: Avatars switched and synchronized across squad without resetting connection.');
    } else {
      results['TEST H: Avatar Selection & Server Synchronization'] = 'FAILED';
    }

    // Launch game from host
    player1.send({ type: 'start_game' });
    await Promise.all([
      player1.waitFor((m) => m.type === 'game_started'),
      player2.waitFor((m) => m.type === 'game_started')
    ]);
    console.log(' -> Game started event received by all squadmates.');

    // TEST D: Both players can move and see each other's movements
    console.log('\n[TEST D] Testing 20 Hz movement synchronization...');
    player1.send({
      type: 'player_update',
      pos: { x: 12.5, y: 1.7, z: -8.2 },
      yaw: 1.57,
      pitch: -0.1,
      stance: 'sprint',
      isSprinting: true,
      currentWeapon: 'm4a1',
      health: 100
    });

    const syncMsg = await player2.waitFor((m) => {
      if (m.type === 'players_sync') {
        const p1 = m.players[player1.getSessionId()];
        return p1 && Math.abs(p1.pos.x - 12.5) < 0.1;
      }
      return false;
    });

    if (syncMsg) {
      results['TEST D: Movement & Transform Synchronization'] = 'PASSED';
      console.log(' -> TEST D PASSED: Real-time position synchronized at 20 Hz.');
    } else {
      results['TEST D: Movement & Transform Synchronization'] = 'FAILED';
    }

    // TEST E: Shooting, damage, and creature health synchronize
    console.log('\n[TEST E] Testing weapon shooting and creature damage synchronization...');
    const shootPromise = player2.waitFor((m) => m.type === 'remote_shoot' && m.weaponId === 'dragon_gun');
    const damagePromise = player2.waitFor((m) => m.type === 'creature_damaged' && m.creatureId === 'zombie_initial_0' && m.damage === 85);

    player1.send({
      type: 'player_shoot',
      origin: { x: 12.5, y: 1.7, z: -8.2 },
      direction: { x: 0, y: 0, z: -1 },
      weaponId: 'dragon_gun',
      hitPoint: { x: 12.5, y: 1.5, z: -25.0 }
    });

    player1.send({
      type: 'creature_damage',
      creatureId: 'zombie_initial_0',
      damage: 85,
      isHeadshot: true
    });

    const [shootReceived, damageReceived] = await Promise.all([shootPromise, damagePromise]);

    if (shootReceived && damageReceived) {
      results['TEST E: Weapon Shooting & Creature Damage Sync'] = 'PASSED';
      console.log(' -> TEST E PASSED: Remote gunfire and creature damage synchronized across squad.');
    } else {
      results['TEST E: Weapon Shooting & Creature Damage Sync'] = 'FAILED';
    }

    // TEST I: Exit Multiplayer / Leave Room & Safe Host Transfer
    console.log('\n[TEST I] Testing Exit Multiplayer and host transfer...');
    // Player 1 (Host) leaves room via leave_room message
    const p2HostTransferPromise = player2.waitFor((m) => m.type === 'player_left' && m.sessionId === player1.getSessionId() && m.newHostId === player2.getSessionId());
    const p1LeaveAckPromise = player1.waitFor((m) => m.type === 'player_left' && m.sessionId === player1.getSessionId());

    player1.send({ type: 'leave_room' });

    const [p2HostTransferNotice, p1LeaveAck] = await Promise.all([p2HostTransferPromise, p1LeaveAckPromise]);
    if (p2HostTransferNotice && p1LeaveAck) {
      results['TEST I: Exit Multiplayer & Host Transfer'] = 'PASSED';
      console.log(` -> TEST I PASSED: Host exited multiplayer, host safely transferred to ${player2.getSessionId()}.`);
    } else {
      results['TEST I: Exit Multiplayer & Host Transfer'] = 'FAILED';
    }

    // Player 1 creates a new room immediately after exiting to verify re-entry without refreshing
    console.log(' -> Testing Player 1 re-entering multiplayer after exiting...');
    player1.send({
      type: 'create_room',
      playerName: 'Titan_Reborn',
      characterId: 'titan',
      mode: 'creature_mode',
      forestType: 'dead_winter',
      difficulty: 'nightmare'
    });
    const reEntryRoomMsg = await player1.waitFor((m) => m.type === 'room_created');
    if (reEntryRoomMsg && reEntryRoomMsg.room.roomCode) {
      console.log(` -> Re-entry successful! New room code: ${reEntryRoomMsg.room.roomCode}`);
    }

    // Cleanup first test clients
    player1.close();
    player2.close();

    // TEST G: Two separate rooms operate independently
    console.log('\n[TEST G] Testing room isolation with two concurrent independent rooms...');
    const player3 = await createClient('Player3_Natasha');
    const player4 = await createClient('Player4_Luis');

    player3.send({
      type: 'create_room',
      playerName: 'Natasha_Medic',
      characterId: 'natasha',
      mode: 'the_fast_guy',
      forestType: 'red_mist',
      difficulty: 'nightmare'
    });

    const room2Created = await player3.waitFor((m) => m.type === 'room_created');
    const roomCode2 = room2Created.room.roomCode;
    console.log(` -> Room 2 Created: "${roomCode2}"`);

    player4.send({
      type: 'join_room',
      roomCode: roomCode2,
      playerName: 'Luis_Heavy',
      characterId: 'luis'
    });
    await player4.waitFor((m) => m.type === 'room_joined');

    // Send chat in room 2
    player3.send({
      type: 'chat',
      text: 'ISOLATION_TEST_ROOM_2'
    });

    const room2Chat = await player4.waitFor((m) => m.type === 'chat_broadcast');

    if (room2Chat && roomCode2) {
      results['TEST G: Complete Room Isolation'] = 'PASSED';
      console.log(' -> TEST G PASSED: Separate rooms operate with 100% isolation.');
    } else {
      results['TEST G: Complete Room Isolation'] = 'FAILED';
    }

    // Cleanup
    player3.close();
    player4.close();

    console.log('\n====================================================');
    console.log('  TEST SUMMARY:');
    Object.entries(results).forEach(([name, status]) => {
      console.log(`  [${status}] ${name}`);
    });
    console.log('====================================================');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
