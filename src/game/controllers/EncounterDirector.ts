import * as THREE from 'three';
import { Creature, CreatureType, DirectorState, GameMode } from '../../types/game';
import { CREATURE_CONFIGS } from '../creatures';
import { soundEngine } from '../audio';

export interface SoundEvent {
  type: 'footstep' | 'gunshot' | 'door' | 'reload' | 'panic';
  position: THREE.Vector3;
  radius: number;
  intensity: number;
  timestamp: number;
}

export class EncounterDirector {
  private mode: GameMode;
  public state: DirectorState = {
    tension: 10,
    phase: 'quiet',
    panicActive: false,
    quietTimer: 5,
    nextSpawnCooldown: 10
  };

  private soundEvents: SoundEvent[] = [];
  private lastSoundCleanupTime: number = 0;

  constructor(mode: GameMode) {
    this.mode = mode;
  }

  public emitSoundEvent(type: 'footstep' | 'gunshot' | 'door' | 'reload' | 'panic', position: THREE.Vector3, radius: number, intensity: number = 1.0) {
    const event: SoundEvent = {
      type,
      position: position.clone(),
      radius,
      intensity,
      timestamp: performance.now()
    };
    this.soundEvents.push(event);

    // Increase director tension on loud events
    if (type === 'gunshot' || type === 'panic') {
      this.state.tension = Math.min(100, this.state.tension + (type === 'panic' ? 40 : 12));
    }
  }

  public triggerPanicEvent(callbacks: { onEventMsg: (msg: string) => void }) {
    this.state.panicActive = true;
    this.state.phase = 'panic';
    this.state.tension = 100;
    callbacks.onEventMsg('⚠️ PANIC EVENT TRIGGERED! CREATURE HORDE SURGING!');
    soundEngine.playCreatureSound('double_tank');
    soundEngine.playCreatureSound('witch_scream');

    // Release panic after 25s
    setTimeout(() => {
      this.state.panicActive = false;
      this.state.phase = 'quiet';
      this.state.quietTimer = 18; // 18 seconds of quiet recovery
      callbacks.onEventMsg('Pacing Director: Area clear. Pacing entering Quiet Recovery.');
    }, 25000);
  }

  public update(
    delta: number, 
    now: number, 
    playerPosition: THREE.Vector3, 
    creatures: Creature[], 
    callbacks: { onEventMsg: (msg: string) => void }
  ) {
    // 1. Sound event cleanup (keep sound events for 3 seconds)
    if (now - this.lastSoundCleanupTime > 1000) {
      this.lastSoundCleanupTime = now;
      this.soundEvents = this.soundEvents.filter(e => now - e.timestamp < 3000);
    }

    // 2. Tension calculation based on active alive creatures
    const activeThreats = creatures.filter(c => c.state !== 'dead' && !c.isTurtle);
    const nearbyThreats = activeThreats.filter(c => c.position && playerPosition.distanceTo(new THREE.Vector3(c.position.x, c.position.y, c.position.z)) < 25);

    if (nearbyThreats.length > 0) {
      this.state.tension = THREE.MathUtils.lerp(this.state.tension, Math.min(100, 30 + nearbyThreats.length * 15), delta * 0.5);
    } else {
      this.state.tension = Math.max(0, this.state.tension - delta * 3.5);
    }

    // 3. Pacing phase state transitions
    if (this.state.panicActive) {
      this.state.phase = 'panic';
    } else if (this.state.quietTimer > 0) {
      this.state.quietTimer -= delta;
      this.state.phase = 'quiet';
    } else if (this.state.tension < 20) {
      this.state.phase = 'exploration';
    } else if (this.state.tension < 50) {
      this.state.phase = 'tension';
    } else if (this.state.tension < 80) {
      this.state.phase = 'investigation';
    } else {
      this.state.phase = 'encounter';
    }

    // 4. Alert nearby creatures to fresh sound events
    this.soundEvents.forEach(sEvent => {
      activeThreats.forEach(c => {
        if (!c.mesh) return;
        const cPos = c.mesh.position;
        const distToSound = cPos.distanceTo(sEvent.position);

        if (distToSound < sEvent.radius * (c.hearingRadius || 1.0)) {
          // If creature is idle/patrolling/wandering, alert it to investigate sound location!
          if (c.state === 'idle' || c.state === 'wander' || c.state === 'patrol' || c.state === 'search') {
            c.state = 'investigate';
            c.investigateTargetPos = sEvent.position.clone();
            c.detectionLevel = Math.min(1.0, (c.detectionLevel || 0) + 0.4);
          }
        }
      });
    });
  }

  public getSoundEvents(): SoundEvent[] {
    return this.soundEvents;
  }
}
