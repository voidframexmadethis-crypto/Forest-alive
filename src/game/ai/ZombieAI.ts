import { BaseEnemyAI } from './BaseEnemyAI';
import { Creature, PlayerStats } from '../../types/game';
import * as THREE from 'three';

export class ZombieAI extends BaseEnemyAI {
  public isStriker: boolean = false;
  public walkSpeed: number = 3.5;
  public runSpeed: number = 7.0;

  constructor(creature: Creature, playerPos: THREE.Vector3, onAttack: () => void) {
    super(creature, playerPos, onAttack);
    this.isStriker = creature.type === 'striker_zombie';
    this.creature.speed = this.isStriker ? this.runSpeed : this.walkSpeed;
  }

  protected behaviorLoop(distanceToPlayer: number, delta: number, now: number, playerStats: PlayerStats): void {
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('movement', true);
    }

    this.moveTowards(this.playerPos, this.creature.speed, delta);

    if (distanceToPlayer <= this.attackRange) {
      this.attack(now);
    }
  }

  protected performSpecificAttack(): void {
    console.log(`${this.enemyName} attacks the player with claws/teeth, spraying blood on impact!`);
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('attack', false);
    }
    this.onAttack();
  }
}
