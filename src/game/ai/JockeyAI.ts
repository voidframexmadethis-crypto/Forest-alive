import { BaseEnemyAI } from './BaseEnemyAI';
import { PlayerStats } from '../../types/game';

export class JockeyAI extends BaseEnemyAI {
  protected behaviorLoop(distanceToPlayer: number, delta: number, now: number, playerStats: PlayerStats): void {
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('movement', true);
    }

    if (distanceToPlayer <= this.creature.attackRange) {
      this.attack(now);
    } else {
      this.moveTowards(this.playerPos, this.creature.speed, delta);
    }
  }

  protected performSpecificAttack(): void {
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('attack', false);
    }
    this.onAttack();
  }
}
