import * as THREE from 'three';
import { BaseEnemyAI } from './BaseEnemyAI';
import { Creature, PlayerStats } from '../../types/game';
import { soundEngine } from '../audio';

export class SkinwalkerAI extends BaseEnemyAI {
  private erraticTimer: number = 0;
  private erraticOffset: THREE.Vector3 = new THREE.Vector3();
  private psychologicalTimer: number = 0;
  private cursePowderTimer: number = 0;
  private harmonyDepletionTimer: number = 0;
  private onFolkloreEvent?: (msg: string) => void;

  constructor(creature: Creature, playerPos: THREE.Vector3, onAttack: () => void, onFolkloreEvent?: (msg: string) => void) {
    super(creature, playerPos, onAttack);
    this.creature.speed = 8.5; // Fast sprinter
    this.onFolkloreEvent = onFolkloreEvent;
  }

  protected behaviorLoop(distanceToPlayer: number, delta: number, now: number, playerStats: PlayerStats): void {
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('movement', true);
    }

    // Add unpredictable jitter to movement
    this.erraticTimer += delta;
    if (this.erraticTimer > 2.0) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 5.0;
      this.erraticOffset.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      this.erraticTimer = 0;
    }

    const targetPos = this.playerPos.clone().add(this.erraticOffset);
    this.moveTowards(targetPos, this.creature.speed, delta);

    // 1. FOLKLORE ATTACK: Psychological Harassment & Terror (Knocking, Scratches, Vocal Mimicry, Animal Intimidation)
    this.psychologicalTimer += delta;
    if (this.psychologicalTimer > 7.0 && distanceToPlayer < 24.0) {
      this.psychologicalTimer = 0;
      const attackType = Math.random();

      if (attackType < 0.35) {
        // Knocking & Scratches
        if (Math.random() < 0.5) {
          soundEngine.playSkinwalkerKnock();
          if (this.onFolkloreEvent) this.onFolkloreEvent('🪵 UNSETTLING SCRATCHES & TAPPING SOUNDS ECHO ON THE ROOF AND WINDOWS LATE AT NIGHT...');
        } else {
          soundEngine.playSkinwalkerScratch();
          if (this.onFolkloreEvent) this.onFolkloreEvent('🪵 DRY FINGERS SCRATCH HATEFULLY AGAINST THE CABIN WALLS...');
        }
      } else if (attackType < 0.7) {
        // Vocal Mimicry
        soundEngine.playSkinwalkerMimicry();
        const mimicPhrases = [
          "🗣️ A VOICE IN THE DARK WOODS CALLS OUT: 'Please... let me inside, it's freezing out here...'",
          "🗣️ A DISTANT INNOCENT CHILD'S VOICE CRIES: 'Daddy? Where are you? Help me...'",
          "🗣️ A FAMILIAR LOVED ONE'S VOICE WHISPERS FROM THE SHADOWS: 'Open the door, I'm right outside...'"
        ];
        const phrase = mimicPhrases[Math.floor(Math.random() * mimicPhrases.length)];
        if (this.onFolkloreEvent) this.onFolkloreEvent(phrase);
      } else {
        // Animal Intimidation with glowing human-like eyes
        soundEngine.playCreatureSound('witch_scream');
        if (this.onFolkloreEvent) this.onFolkloreEvent('🐺 A DISTORTED WOLF / GIANT DOG EMERGES FROM THE PINES WITH UNNATURALLY GLOWING HUMAN-LIKE EYES STARRING AT YOU!');
      }
    }

    // 2. FOLKLORE ATTACK: Curse Powder ('Ánt'įįh)
    this.cursePowderTimer += delta;
    if (this.cursePowderTimer > 15.0 && distanceToPlayer < 15.0) {
      this.cursePowderTimer = 0;
      soundEngine.playCursePowderSound();
      playerStats.health = Math.max(10, playerStats.health - 8); // Sudden wasting illness
      playerStats.bloodOnScreen = Math.min(1.0, playerStats.bloodOnScreen + 0.3);
      if (this.onFolkloreEvent) this.onFolkloreEvent("💀 THE SKINWALKER DROPS MALEVOLENT CRUSHED BONE CURSE POWDER ('Ánt'įįh) THROUGH THE ROOF CRACKS! SUDDEN ILLNESS AND WASTING DISEASE STRIKE!");
    }

    // 3. FOLKLORE ATTACK: Spiritual & Energy Depletion (Violating Hózhǫ́ Harmony)
    if (distanceToPlayer < 18.0) {
      this.harmonyDepletionTimer += delta;
      if (this.harmonyDepletionTimer >= 3.0) {
        this.harmonyDepletionTimer = 0;
        playerStats.stamina = Math.max(0, playerStats.stamina - 10); // Vitality drainage
        if (this.onFolkloreEvent && Math.random() < 0.5) {
          this.onFolkloreEvent("🌀 THE SKINWALKER VIOLATES SACRED HARMONY (HÓZHǪ́). YOUR VITALITY AND ENERGY SLOWLY FADE AWAY...");
        }
      }
    }

    if (distanceToPlayer <= this.attackRange * 1.5) {
      this.attack(now);
    }
  }

  protected performSpecificAttack(): void {
    soundEngine.playCreatureSound('witch_scream');
    if (this.creature.visualController) {
      this.creature.visualController.playAnimation('attack', false);
    }
    if (this.onFolkloreEvent) this.onFolkloreEvent("🩸 THE SKINWALKER LASHES OUT WITH SUPERNATURAL CLAWS AND RENDING DARKNESS!");
    this.onAttack();
  }
}
