import { BaseEnemyAI } from './BaseEnemyAI';
import { Creature, PlayerStats } from '../../types/game';
import * as THREE from 'three';

export class StickSkinwalkerAI extends BaseEnemyAI {
  constructor(creature: Creature, playerPos: THREE.Vector3, onAttack: () => void) {
    super(creature, playerPos, onAttack);
    this.creature.speed = 5.0;
  }

  protected behaviorLoop(distanceToPlayer: number, delta: number, now: number, playerStats: PlayerStats): void {
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('movement', true);
    }

    this.moveTowards(this.playerPos, this.creature.speed, delta);

    if (distanceToPlayer <= 4.0) {
      this.attack(now);
    }
  }

  protected performSpecificAttack(): void {
    console.log("18ft Stick Skinwalker bends its backward limbs and delivers an ear-shattering, terrifying screech directly into the player's ear!");
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('attack', false);
    }
    this.onAttack();
  }
}
