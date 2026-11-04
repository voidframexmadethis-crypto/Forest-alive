import * as THREE from 'three';
import { BaseEnemyAI } from './BaseEnemyAI';
import { PlayerStats } from '../../types/game';

export class WingedIceAI extends BaseEnemyAI {
  public flightHeight: number = 10.0;

  protected behaviorLoop(distanceToPlayer: number, delta: number, now: number, playerStats: PlayerStats): void {
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('movement', true);
    }

    // Orbit and dive-bomb above the player
    const hoverTarget = this.playerPos.clone().add(new THREE.Vector3(0, this.flightHeight, 0));
    this.moveTowards3D(hoverTarget, 6.0, delta);

    if (this.creature.mesh) {
      this.creature.mesh.lookAt(this.playerPos.x, this.playerPos.y, this.playerPos.z);
    }

    if (now >= this.lastAttackTime + this.attackCooldown) {
      this.attack(now);
    }
  }

  protected performSpecificAttack(): void {
    console.log("Winged Frost Skinwalker unleashes freezing white ice spray, locking the player in place!");
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('attack', false);
    }
    this.onAttack();
  }
}
