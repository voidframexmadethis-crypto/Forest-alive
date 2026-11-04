import * as THREE from 'three';
import { BaseEnemyAI } from './BaseEnemyAI';
import { PlayerStats } from '../../types/game';

export class SubterraneanSnakeAI extends BaseEnemyAI {
  private isUnderground: boolean = true;
  private submergeTimer: number = 0;

  protected behaviorLoop(distanceToPlayer: number, delta: number, now: number, playerStats: PlayerStats): void {
    if (this.isUnderground) {
      if (this.creature.mesh) {
        this.creature.mesh.position.y = -1.2;
      }

      // Move beneath terrain toward player position
      const targetPos = new THREE.Vector3(this.playerPos.x, -1.2, this.playerPos.z);
      this.moveTowards3D(targetPos, 5.0, delta);

      if (distanceToPlayer <= 3.0) {
        this.surfaceAndStrike();
      }
    } else {
      // Surfaced above ground
      this.submergeTimer -= delta;
      if (this.submergeTimer <= 0) {
        this.submerge();
      }
    }
  }

  private surfaceAndStrike(): void {
    this.isUnderground = false;
    this.submergeTimer = 4.0;
    if (this.creature.mesh) {
      this.creature.mesh.position.y = 0.3;
    }

    console.log("Pit Snake bursts from the ground, attempting to pull player into the earth!");
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('attack', false);
    }
    this.onAttack();
  }

  private submerge(): void {
    this.isUnderground = true;
    if (this.creature.mesh) {
      this.creature.mesh.position.y = -1.2;
    }
  }

  protected performSpecificAttack(): void { }
}
