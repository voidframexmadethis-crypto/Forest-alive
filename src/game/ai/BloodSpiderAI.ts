import * as THREE from 'three';
import { BaseEnemyAI } from './BaseEnemyAI';
import { PlayerStats } from '../../types/game';

export class BloodSpiderAI extends BaseEnemyAI {
  private isAttachedToPlayer: boolean = false;
  private drainTimer: number = 0;

  protected behaviorLoop(distanceToPlayer: number, delta: number, now: number, playerStats: PlayerStats): void {
    if (this.creature.state === 'dead') {
      this.isAttachedToPlayer = false;
      return;
    }

    if (this.isAttachedToPlayer) {
      // Keep spider attached to player face/torso at local offset (0, 1.2, 0.5)
      if (this.creature.mesh) {
        this.creature.mesh.position.set(
          this.playerPos.x,
          this.playerPos.y + 1.2,
          this.playerPos.z + 0.5
        );
        this.creature.position.x = this.creature.mesh.position.x;
        this.creature.position.y = this.creature.mesh.position.y;
        this.creature.position.z = this.creature.mesh.position.z;
        this.creature.mesh.lookAt(this.playerPos.x, this.playerPos.y + 1.2, this.playerPos.z);
      }

      // Drain player health over time
      this.drainTimer += delta;
      if (this.drainTimer >= 1.0) {
        console.log("Blood Spider is draining player's blood!");
        this.drainTimer = 0;
        this.onAttack();
      }
      return;
    }

    if (distanceToPlayer <= 6.0 && !this.isAttachedToPlayer) {
      this.leapOntoPlayer();
    } else {
      if (this.creature.visualController) {
        this.creature.visualController.playAnimation('movement', true);
      }
      this.moveTowards(this.playerPos, this.creature.speed, delta);
    }
  }

  private leapOntoPlayer(): void {
    this.isAttachedToPlayer = true;
    if (this.creature.mesh) {
      this.creature.mesh.position.set(
        this.playerPos.x,
        this.playerPos.y + 1.2,
        this.playerPos.z + 0.5
      );
    }
    console.log("Giant Blood Spider latched onto the player!");
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('attack', true);
    }
    this.onAttack();
  }

  protected performSpecificAttack(): void {
    // Attack handled via LeapOntoPlayer and continuous draining
  }
}
