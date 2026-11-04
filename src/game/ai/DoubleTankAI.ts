import { BaseEnemyAI } from './BaseEnemyAI';
import { Creature, PlayerStats } from '../../types/game';
import * as THREE from 'three';

export class DoubleTankAI extends BaseEnemyAI {
  public groundShakeRadius: number = 15.0;

  constructor(creature: Creature, playerPos: THREE.Vector3, onAttack: () => void) {
    super(creature, playerPos, onAttack);
    this.creature.speed = 3.0; // Slow, heavy steps
  }

  protected behaviorLoop(distanceToPlayer: number, delta: number, now: number, playerStats: PlayerStats): void {
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('movement', true);
    }

    this.moveTowards(this.playerPos, this.creature.speed, delta);

    if (distanceToPlayer <= this.attackRange * 2.0) {
      this.attack(now);
    }
  }

  protected performSpecificAttack(): void {
    console.log("The Tank slams the ground with immense force, causing screen shake and heavy damage!");
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('attack', false);
    }
    this.onAttack();
  }
}
