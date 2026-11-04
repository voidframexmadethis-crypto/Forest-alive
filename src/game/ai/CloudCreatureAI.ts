import * as THREE from 'three';
import { BaseEnemyAI } from './BaseEnemyAI';
import { PlayerStats } from '../../types/game';

export class CloudCreatureAI extends BaseEnemyAI {
  protected behaviorLoop(distanceToPlayer: number, delta: number, now: number, playerStats: PlayerStats): void {
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('movement', true);
    }

    const target = this.playerPos.clone();
    target.y = 10; 

    this.moveTowards(target, this.creature.speed, delta);

    if (distanceToPlayer <= this.creature.attackRange) {
      this.attack(now);
    }
  }

  protected performSpecificAttack(): void {
    this.onAttack();
  }

  protected moveTowards(target: THREE.Vector3, speed: number, delta: number) {
    if (!this.creature.mesh) return;

    const cPos = this.creature.mesh.position;
    const dir = new THREE.Vector3().subVectors(target, cPos);
    dir.normalize();

    cPos.addScaledVector(dir, speed * delta);
    this.creature.position.x = cPos.x;
    this.creature.position.y = cPos.y;
    this.creature.position.z = cPos.z;

    this.creature.mesh.lookAt(target.x, cPos.y, target.z);
  }
}
