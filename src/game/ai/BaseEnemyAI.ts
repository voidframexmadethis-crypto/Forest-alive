import * as THREE from 'three';
import { Creature, CreatureAIState, PlayerStats } from '../../types/game';

/**
 * Base abstract class for Creature AI, mirroring Unity structure.
 */
export abstract class BaseEnemyAI {
  public enemyName: string = "Creature";
  public detectionRange: number = 22;
  public attackRange: number = 2;
  public attackCooldown: number = 1500; // ms

  protected creature: Creature;
  protected playerPos: THREE.Vector3;
  protected lastAttackTime: number = 0;
  protected isDead: boolean = false;
  protected onAttack: () => void;

  constructor(creature: Creature, playerPos: THREE.Vector3, onAttack: () => void) {
    this.creature = creature;
    this.playerPos = playerPos;
    this.onAttack = onAttack;
    this.enemyName = creature.name;
    this.attackRange = creature.attackRange;
    this.attackCooldown = creature.attackCooldown;
  }

  /**
   * Main update loop for the AI, called every frame.
   */
  public update(delta: number, now: number, playerStats: PlayerStats) {
    if (this.creature.state === 'dead' || !this.playerPos) return;

    // 1. Stun Handling
    if (this.creature.stunTimer && this.creature.stunTimer > 0) {
      this.creature.stunTimer -= delta;
      if (this.creature.stunTimer <= 0) {
        this.creature.stunTimer = 0;
        if (this.creature.mesh && !this.creature.isTurtle) {
          this.creature.mesh.position.y = 0;
        }
      }
      return;
    }

    // 2. Turtle State (Peaceful)
    if (this.creature.isTurtle) {
      this.creature.idleTimer = (this.creature.idleTimer || 0) + delta * 1.5;
      if (this.creature.mesh) {
        this.creature.mesh.rotation.y += Math.sin(this.creature.idleTimer) * 0.015;
        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.creature.mesh.rotation.y);
        this.creature.mesh.position.addScaledVector(forward, this.creature.speed * delta);
        this.creature.position.x = this.creature.mesh.position.x;
        this.creature.position.z = this.creature.mesh.position.z;
      }
      return;
    }

    // 3. Fleeing State
    if (this.creature.state === 'fleeing') {
      if (this.creature.visualController) {
        this.creature.visualController.playAnimation('movement', true);
      }
      // Fleeing logic (move away from cloud) is often handled by the cloud interaction, 
      // but here we just ensure they don't attack.
      return;
    }

    const cPos = this.creature.mesh ? this.creature.mesh.position : new THREE.Vector3(this.creature.position.x, this.creature.position.y, this.creature.position.z);
    const distanceToPlayer = cPos.distanceTo(this.playerPos);

    // 4. Advanced Detection
    this.handleDetection(distanceToPlayer, playerStats, delta, now);

    // 5. State-based Behavior
    if (this.creature.state === 'chasing' || this.creature.state === 'chase') {
      this.behaviorLoop(distanceToPlayer, delta, now, playerStats);
    } else if (this.creature.state === 'investigate') {
      this.handleInvestigate(cPos, delta);
    } else if (this.creature.state === 'search') {
      this.handleSearch(delta, now);
    } else {
      this.patrolOrIdle(delta, now);
    }
  }

  protected handleDetection(distanceToPlayer: number, playerStats: PlayerStats, delta: number, now: number) {
    if (this.creature.state === 'chasing' || this.creature.state === 'chase') {
      // Break line of sight if too far
      if (distanceToPlayer > 28.0) {
        this.creature.state = 'search';
        this.creature.searchTimer = 6.0;
        this.creature.lastKnownPlayerPos = this.playerPos.clone() as any;
      }
      return;
    }

    if (distanceToPlayer < this.detectionRange) {
      const cPos = this.creature.mesh.position;
      const playerDir = new THREE.Vector3().subVectors(this.playerPos, cPos).normalize();
      const creatureForward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.creature.mesh.rotation.y);

      const isSprintingNoise = playerStats.isSprinting && distanceToPlayer < 18.0;
      const isInViewCone = creatureForward.dot(playerDir) > 0.3 && distanceToPlayer < 16.0;

      if (distanceToPlayer < 6.0 || isInViewCone || isSprintingNoise) {
        this.creature.state = 'chasing';
        this.creature.lastKnownPlayerPos = this.playerPos.clone() as any;
      }
    }
  }

  protected handleInvestigate(cPos: THREE.Vector3, delta: number) {
    if (!this.creature.investigateTargetPos) {
      this.creature.state = 'idle';
      return;
    }

    const invTarget = new THREE.Vector3(this.creature.investigateTargetPos.x, cPos.y, this.creature.investigateTargetPos.z);
    const distToSound = cPos.distanceTo(invTarget);

    if (distToSound > 2.0) {
      const dir = new THREE.Vector3().subVectors(invTarget, cPos).normalize();
      cPos.addScaledVector(dir, this.creature.speed * 0.5 * delta);
      this.creature.mesh.lookAt(invTarget.x, cPos.y, invTarget.z);
      if (this.creature.visualController) this.creature.visualController.playAnimation('movement', true);
    } else {
      this.creature.state = 'search';
      this.creature.searchTimer = 5.0;
    }
  }

  protected handleSearch(delta: number, now: number) {
    this.creature.searchTimer = (this.creature.searchTimer || 0) - delta;
    this.creature.mesh.rotation.y += Math.sin(now * 0.003) * 0.02;
    if (this.creature.visualController) this.creature.visualController.playAnimation('idle', true);

    if ((this.creature.searchTimer || 0) <= 0) {
      this.creature.state = 'idle';
      this.creature.investigateTargetPos = null;
    }
  }

  /**
   * Logic to run when player is within detection range.
   */
  protected abstract behaviorLoop(distanceToPlayer: number, delta: number, now: number, playerStats: PlayerStats): void;

  /**
   * Logic to run when player is outside detection range.
   */
  protected patrolOrIdle(delta: number, now: number) {
    this.creature.idleTimer = (this.creature.idleTimer || 0) + delta * 2.0;
    this.creature.mesh.position.y += Math.sin(this.creature.idleTimer) * 0.005;
    this.creature.mesh.rotation.y += Math.sin(this.creature.idleTimer * 0.5) * 0.002;
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('idle', true);
    }
  }

  /**
   * Trigger an attack if cooldown allows.
   */
  public attack(now: number) {
    if (now >= this.lastAttackTime + this.attackCooldown) {
      this.lastAttackTime = now;
      this.performSpecificAttack();
    }
  }

  /**
   * Unique attack implementation for each creature type.
   */
  protected abstract performSpecificAttack(): void;

  /**
   * Helper to move the creature mesh towards a target.
   */
  protected moveTowards(target: THREE.Vector3, speed: number, delta: number) {
    if (!this.creature.mesh) return;

    const cPos = this.creature.mesh.position;
    const dir = new THREE.Vector3().subVectors(target, cPos);
    dir.y = 0;
    dir.normalize();

    cPos.addScaledVector(dir, speed * delta);
    this.creature.position.x = cPos.x;
    this.creature.position.z = cPos.z;

    this.creature.mesh.lookAt(target.x, cPos.y, target.z);
  }

  /**
   * Helper to move the creature mesh in full 3D towards a target.
   */
  protected moveTowards3D(target: THREE.Vector3, speed: number, delta: number) {
    if (!this.creature.mesh) return;

    const cPos = this.creature.mesh.position;
    const dir = new THREE.Vector3().subVectors(target, cPos);
    const dist = dir.length();
    if (dist > 0.001) {
      dir.normalize();
      const step = Math.min(dist, speed * delta);
      cPos.addScaledVector(dir, step);
      this.creature.position.x = cPos.x;
      this.creature.position.y = cPos.y;
      this.creature.position.z = cPos.z;
    }
  }
}

