import * as THREE from 'three';
import { BaseEnemyAI } from './BaseEnemyAI';
import { Creature, PlayerStats } from '../../types/game';

export class SkinwalkerAI extends BaseEnemyAI {
  private erraticTimer: number = 0;
  private erraticOffset: THREE.Vector3 = new THREE.Vector3();

  constructor(creature: Creature, playerPos: THREE.Vector3, onAttack: () => void) {
    super(creature, playerPos, onAttack);
    this.creature.speed = 8.5; // Agent speed = 8.5f
  }

  protected behaviorLoop(distanceToPlayer: number, delta: number, now: number, playerStats: PlayerStats): void {
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('movement', true);
    }

    // Add unpredictable jitter to movement
    this.erraticTimer += delta;
    if (this.erraticTimer > 2.0) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 4.0;
      this.erraticOffset.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      this.erraticTimer = 0;
    }

    const targetPos = this.playerPos.clone().add(this.erraticOffset);
    this.moveTowards(targetPos, this.creature.speed, delta);

    if (distanceToPlayer <= this.attackRange * 1.5) {
      this.attack(now);
    }
  }

  protected performSpecificAttack(): void {
    console.log("Skinwalker performs a vicious supernatural claw lunge!");
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('attack', false);
    }
    this.onAttack();
  }
}
