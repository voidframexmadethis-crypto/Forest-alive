import * as THREE from 'three';
import { BaseEnemyAI } from './BaseEnemyAI';
import { Creature, PlayerStats } from '../../types/game';
import { soundEngine } from '../audio';

export class NunAI extends BaseEnemyAI {
  public nunLife: number = 6; // 6 Lives system!
  private phaseTimer: number = 0;
  private isBurrowed: boolean = false;
  private isTreePeeking: boolean = false;
  private isInvisible: boolean = false;
  private snakeNeckExtending: boolean = false;
  private onNunEvent?: (msg: string) => void;

  constructor(creature: Creature, playerPos: THREE.Vector3, onAttack: () => void, onNunEvent?: (msg: string) => void) {
    super(creature, playerPos, onAttack);
    this.creature.speed = 6.0;
    this.nunLife = 6;
    this.onNunEvent = onNunEvent;
  }

  protected behaviorLoop(distanceToPlayer: number, delta: number, now: number, playerStats: PlayerStats): void {
    this.phaseTimer += delta;

    // Hovering / Flying movement above ground
    const targetPos = this.playerPos.clone();
    targetPos.y += 2.2; // Hovering above ground

    if (this.nunLife === 6) {
      // LIFE 1: Floating Hover Nun with blood mouth, hugging & scratching
      this.moveTowards3D(targetPos, this.creature.speed, delta);
      if (distanceToPlayer <= this.attackRange * 1.5) {
        this.attack(now);
      }
    } else if (this.nunLife === 5) {
      // LIFE 2: Winged Nun - extreme brutality & fast dive
      this.creature.speed = 7.5;
      this.moveTowards3D(targetPos, this.creature.speed, delta);
      if (distanceToPlayer <= this.attackRange * 2.0) {
        this.attack(now);
      }
    } else if (this.nunLife === 4) {
      // LIFE 3: Blind Attack Nun - blinds eyes for 3 seconds
      this.moveTowards3D(targetPos, this.creature.speed, delta);
      if (this.phaseTimer > 8.0) {
        this.phaseTimer = 0;
        playerStats.blindTimer = 3.0; // 3 seconds of total blindness!
        if (this.onNunEvent) this.onNunEvent("👁️ THE BLIND ATTACK! THE NUN SEARS DARKNESS OVER YOUR EYES FOR 3 SECONDS!");
        soundEngine.playCreatureSound('witch_scream');
      }
      if (distanceToPlayer <= this.attackRange * 1.5) {
        this.attack(now);
      }
    } else if (this.nunLife === 3) {
      // LIFE 4: Underground Digging Nun - digs hole and does underground jump scare
      if (!this.isBurrowed && this.phaseTimer > 6.0) {
        this.isBurrowed = true;
        if (this.onNunEvent) this.onNunEvent("🕳️ THE NUN DIES AND SINKS INTO THE EARTH! SUBTERRANEAN JUMP SCARE INCOMING!");
        soundEngine.playCreatureSound('subterranean_snake');
        
        setTimeout(() => {
          if (this.creature.mesh && this.playerPos) {
            this.creature.mesh.position.copy(this.playerPos).add(new THREE.Vector3(0, 0, 1.5));
            this.isBurrowed = false;
            this.phaseTimer = 0;
            if (this.onNunEvent) this.onNunEvent("💥 THE NUN EXPLODES OUT OF THE GROUND RIGHT IN FRONT OF YOU!");
            soundEngine.playExplosion();
          }
        }, 2500);
      }
      if (!this.isBurrowed) {
        this.moveTowards(targetPos, this.creature.speed, delta);
        if (distanceToPlayer <= this.attackRange) this.attack(now);
      }
    } else if (this.nunLife === 2) {
      // LIFE 5: Creeper Tree-Peeking Nun - hides behind trees, peeks around them and teleports
      if (!this.isTreePeeking && this.phaseTimer > 5.0) {
        this.isTreePeeking = true;
        const offset = new THREE.Vector3((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8);
        if (this.creature.mesh) {
          this.creature.mesh.position.copy(this.playerPos).add(offset);
          if (this.onNunEvent) this.onNunEvent("🌲 THE CREEPER NUN HIDES BEHIND TREES, PEEKS AROUND THEM, AND TELEPORTS!");
        }
        setTimeout(() => {
          this.isTreePeeking = false;
          this.phaseTimer = 0;
        }, 3000);
      }
      if (!this.isTreePeeking) {
        this.moveTowards3D(targetPos, this.creature.speed, delta);
        if (distanceToPlayer <= this.attackRange) this.attack(now);
      }
    } else if (this.nunLife === 1) {
      // LIFE 6: Ultimate Hide and Seek / Invisible / Snake Neck Attack - the worst of all!
      this.isInvisible = true;
      if (this.creature.mesh) {
        this.creature.mesh.visible = false; // Completely invisible!
      }

      if (this.phaseTimer > 4.0) {
        this.phaseTimer = 0;
        // Teleport right next to player and snake neck bite!
        if (this.creature.mesh) {
          const sneakAngle = Math.random() * Math.PI * 2;
          const sneakPos = this.playerPos.clone().add(new THREE.Vector3(Math.cos(sneakAngle) * 2.0, 1.8, Math.sin(sneakAngle) * 2.0));
          this.creature.mesh.position.copy(sneakPos);
          this.creature.mesh.visible = true; // briefly visible

          soundEngine.playSkinwalkerMimicry();
          if (this.onNunEvent) this.onNunEvent("🐍 THE ULTIMATE NUN ATTACK! HER NECK EXTENDS LIKE A SNAKE TO BITE YOU FROM THE DARK!");
          
          playerStats.health = Math.max(5, playerStats.health - 25);
          playerStats.bloodOnScreen = 0.9;
          soundEngine.playCreatureSound('witch_scream');

          setTimeout(() => {
            if (this.creature.mesh) this.creature.mesh.visible = false;
          }, 1200);
        }
      }
    }
  }

  protected performSpecificAttack(): void {
    soundEngine.playCreatureSound('witch_scream');
    if (this.onNunEvent) {
      const attacks = [
        "🖤 THE NUN PICKS YOU UP, GIVES YOU A DEADLY HUG AND SCRATCHES YOUR CHEST!",
        "🪵 THE NUN WHACKS YOU BRUTALLY WITH A HAUNTED WOODEN STICK!",
        "🩸 BLOOD SPEWS FROM THE NUN'S WIDE-OPEN MOUTH AS SHE MAULS YOU!"
      ];
      this.onNunEvent(attacks[Math.floor(Math.random() * attacks.length)]);
    }
    this.onAttack();
  }

  public handleLifeLoss(): boolean {
    // Returns true if truly dead (life 1 depleted), false if advances to next life phase
    if (this.nunLife > 1) {
      this.nunLife--;
      this.creature.health = this.creature.maxHealth; // Reset health for next life phase!
      soundEngine.playExplosion();
      if (this.onNunEvent) {
        this.onNunEvent(`✝️ THE NUN'S LIFE DEMOLISHED! REMAINING LIVES: ${this.nunLife}/6! SHE EVOLVES INTO A MORE BRUTAL FORM!`);
      }
      return false; // Not dead yet!
    }
    return true; // Finally dead at life 6!
  }
}
