import * as THREE from 'three';
import { Creature } from '../types/game';

export type GoldenEagleVehicleState = 'idle' | 'dispatching' | 'waiting_for_boarding' | 'escorting';

export interface GoldenEagleOptions {
  scene: THREE.Scene;
  safehousePos: THREE.Vector3;
  onEvent?: (msg: string) => void;
  onCreatureDamage?: (creatureId: string, damage: number, hitLocation?: string) => void;
}

export class GoldenEagleVehicle {
  private scene: THREE.Scene;
  public group: THREE.Group;
  
  // Visual & Cosmetic Setup
  public bodyPaintColor = new THREE.Color(0.85, 0.65, 0.13); // Golden/Bronze (#D9A621)
  private carBodyMesh!: THREE.Mesh;
  private spectralHeadlights: THREE.SpotLight[] = [];
  private bladeMesh!: THREE.Mesh;
  private bloodParticles: THREE.Points;
  private bloodParticleGeo: THREE.BufferGeometry;
  private bloodParticlePositions: Float32Array;
  private bloodParticleVelocities: THREE.Vector3[] = [];
  private bloodParticleActive: boolean[] = [];

  // Hydraulic Suspension System
  private wheelMounts: THREE.Group[] = [];
  private baseSuspensionHeight = 0.5;
  private hydraulicRaisedHeight = 1.2;
  private hydraulicBounceForce = 8500;
  private hydraulicCooldown = 1.5; // seconds
  private isHydraulicsActive = false;
  private nextHydraulicTime = 0;
  private hydraulicAnimTimer = 0;

  // Front Blade & Combat Physics
  public bladeDamage = 500;
  public enemyKnockbackForce = 1500;

  // Self-Driving AI & Extraction Logic
  public driveSpeed = 25.0; // m/s
  public turnRadius = 15.0;
  public currentDestination: THREE.Vector3 | null = null;
  public safehouseDestination: THREE.Vector3;
  public currentState: GoldenEagleVehicleState = 'idle';

  // Player & Multiplayer Logic
  public maxPassengerCapacity = 4;
  public passengersInside: string[] = []; // player IDs or 'local_player'
  public isDoorsLocked = false;
  
  public position = new THREE.Vector3(-45, 0, -40); // Initial off-site spawn
  public rotation = 0; // Yaw angle in radians

  private onEvent?: (msg: string) => void;
  private onCreatureDamage?: (creatureId: string, damage: number, hitLocation?: string) => void;

  constructor(options: GoldenEagleOptions) {
    this.scene = options.scene;
    this.safehouseDestination = options.safehousePos.clone();
    this.onEvent = options.onEvent;
    this.onCreatureDamage = options.onCreatureDamage;

    this.group = new THREE.Group();
    this.buildVehicleMesh();
    this.group.position.copy(this.position);
    this.scene.add(this.group);

    // Initialize Blood Splatter Particles FX
    const particleCount = 60;
    this.bloodParticleGeo = new THREE.BufferGeometry();
    this.bloodParticlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      this.bloodParticleActive.push(false);
      this.bloodParticleVelocities.push(new THREE.Vector3());
    }
    this.bloodParticleGeo.setAttribute('position', new THREE.BufferAttribute(this.bloodParticlePositions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xcc0000, size: 0.25, transparent: true, opacity: 0.9 });
    this.bloodParticles = new THREE.Points(this.bloodParticleGeo, pMat);
    this.scene.add(this.bloodParticles);
  }

  private buildVehicleMesh() {
    const goldPaintMat = new THREE.MeshStandardMaterial({
      color: 0xd9a621, // Golden Bronze
      metalness: 0.85,
      roughness: 0.3
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.6, metalness: 0.8 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xffd700, transparent: true, opacity: 0.6, metalness: 0.9 });
    const steelBladeMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.95, roughness: 0.2 });

    // 1. Heavy Armored Truck Body
    this.carBodyMesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.4, 5.8), goldPaintMat);
    this.carBodyMesh.position.y = 1.1;
    this.carBodyMesh.castShadow = true;
    this.carBodyMesh.receiveShadow = true;
    this.group.add(this.carBodyMesh);

    // Reinforced Cab & Roof
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 2.8), goldPaintMat);
    cab.position.set(0, 2.05, -0.4);
    cab.castShadow = true;
    this.group.add(cab);

    // Golden Eagle Emblem Badge on Hood
    const emblem = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0xffea00, metalness: 1.0, roughness: 0.1 }));
    emblem.position.set(0, 1.82, 1.8);
    this.group.add(emblem);

    // Reinforced Windshield with Golden Tint
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.1), glassMat);
    windshield.position.set(0, 2.05, 1.02);
    windshield.rotation.x = -0.2;
    this.group.add(windshield);

    // 2. Hydraulic Wheel Suspension Mounts (4 Wheels)
    const wheelPositions = [
      { x: -1.5, z: 1.8 }, { x: 1.5, z: 1.8 },
      { x: -1.5, z: -1.8 }, { x: 1.5, z: -1.8 }
    ];

    wheelPositions.forEach((wp) => {
      const mountGroup = new THREE.Group();
      mountGroup.position.set(wp.x, this.baseSuspensionHeight, wp.z);

      // Heavy Off-road Wheel
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.5, 16), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      mountGroup.add(wheel);

      // Hydraulic Strut
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8), darkTrimMat);
      strut.position.y = 0.4;
      mountGroup.add(strut);

      this.wheelMounts.push(mountGroup);
      this.group.add(mountGroup);
    });

    // 3. Spectral Headlights
    const headlightL = new THREE.SpotLight(0xffcc33, 4.0, 35, Math.PI / 4, 0.3);
    headlightL.position.set(-1.1, 1.3, 2.9);
    headlightL.target.position.set(-1.1, 0, 18);
    this.group.add(headlightL, headlightL.target);
    this.spectralHeadlights.push(headlightL);

    const headlightR = new THREE.SpotLight(0xffcc33, 4.0, 35, Math.PI / 4, 0.3);
    headlightR.position.set(1.1, 1.3, 2.9);
    headlightR.target.position.set(1.1, 0, 18);
    this.group.add(headlightR, headlightR.target);
    this.spectralHeadlights.push(headlightR);

    // Glowing Lamp Bulbs
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    const bulbL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.1), bulbMat);
    bulbL.position.set(-1.1, 1.3, 2.92);
    const bulbR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.1), bulbMat);
    bulbR.position.set(1.1, 1.3, 2.92);
    this.group.add(bulbL, bulbR);

    // 4. Front Blade (Front Blade & Combat Physics)
    const bladeGroup = new THREE.Group();
    bladeGroup.position.set(0, 0.7, 3.1);

    // Curved Steel Plow Blade
    const bladePlow = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 0.2), steelBladeMat);
    bladePlow.castShadow = true;
    bladeGroup.add(bladePlow);

    // Serrated Teeth along bottom edge
    for (let t = -1.4; t <= 1.4; t += 0.35) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 4), steelBladeMat);
      tooth.rotation.x = Math.PI;
      tooth.position.set(t, -0.45, 0.05);
      bladeGroup.add(tooth);
    }

    this.bladeMesh = bladePlow;
    this.group.add(bladeGroup);
  }

  // ==========================================
  // HYDRAULIC SUSPENSION MECHANICAL BOUNCE
  // ==========================================
  public triggerHydraulicBounce(currentTimeSeconds: number, creatures: Creature[]) {
    if (currentTimeSeconds < this.nextHydraulicTime) return;

    this.nextHydraulicTime = currentTimeSeconds + this.hydraulicCooldown;
    this.isHydraulicsActive = true;
    this.hydraulicAnimTimer = 0.4; // 0.4s hydraulic jump duration

    // Lift suspension mounts rapidly
    this.wheelMounts.forEach((wm) => {
      wm.position.y = this.hydraulicRaisedHeight;
    });

    // Hydraulic shockwave & slam surrounding monsters
    const vPos = this.group.position;
    creatures.forEach((c) => {
      if (c.state !== 'dead') {
        const dist = Math.hypot(c.position.x - vPos.x, c.position.z - vPos.z);
        if (dist < 6.0) {
          c.health -= 350; // Hydraulic ground slam damage
          if (this.onCreatureDamage) {
            this.onCreatureDamage(c.id, 350, 'legs');
          }
          // Blast creature away
          const dx = (c.position.x - vPos.x) / (dist || 1);
          const dz = (c.position.z - vPos.z) / (dist || 1);
          c.position.x += dx * 4.0;
          c.position.z += dz * 4.0;
          this.triggerBloodSplatterFX(new THREE.Vector3(c.position.x, c.position.y + 1, c.position.z));
        }
      }
    });

    if (this.onEvent) {
      this.onEvent('💥 GOLDEN EAGLE HYDRAULIC BOUNCE EXECUTED!');
    }
  }

  // ==========================================
  // FRONT BLADE COMBAT IMPACT & BLOOD SPLATTER
  // ==========================================
  private checkBladeCollisions(creatures: Creature[]) {
    // Front blade world position
    const bladeWorldPos = new THREE.Vector3(0, 0.7, 3.2).applyMatrix4(this.group.matrixWorld);

    creatures.forEach((c) => {
      if (c.state !== 'dead') {
        const dist = bladeWorldPos.distanceTo(new THREE.Vector3(c.position.x, c.position.y, c.position.z));
        if (dist < 2.8) {
          // Lethal blade damage
          c.health -= this.bladeDamage;
          if (this.onCreatureDamage) {
            this.onCreatureDamage(c.id, this.bladeDamage, 'torso');
          }

          // Knockback force in vehicle facing direction
          const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
          c.position.x += forward.x * 6.5;
          c.position.z += forward.z * 6.5;

          // Play blood splatter particle FX
          this.triggerBloodSplatterFX(new THREE.Vector3(c.position.x, c.position.y + 1.2, c.position.z));

          if (c.health <= 0) {
            c.state = 'dead';
            if (c.visualController) c.visualController.playAnimation('death', false);
            this.scene.remove(c.mesh);
            if (this.onEvent) {
              this.onEvent(`💥 GOLDEN EAGLE SHREDDED ${c.name.toUpperCase()} WITH FRONT BLADE!`);
            }
          }
        }
      }
    });
  }

  public triggerBloodSplatterFX(impactPos: THREE.Vector3) {
    for (let i = 0; i < 15; i++) {
      const idx = Math.floor(Math.random() * (this.bloodParticlePositions.length / 3));
      this.bloodParticleActive[idx] = true;
      this.bloodParticlePositions[idx * 3] = impactPos.x;
      this.bloodParticlePositions[idx * 3 + 1] = impactPos.y;
      this.bloodParticlePositions[idx * 3 + 2] = impactPos.z;

      this.bloodParticleVelocities[idx].set(
        (Math.random() - 0.5) * 6,
        Math.random() * 4 + 2,
        (Math.random() - 0.5) * 6
      );
    }
  }

  private updateBloodParticles(delta: number) {
    for (let i = 0; i < this.bloodParticleActive.length; i++) {
      if (this.bloodParticleActive[i]) {
        this.bloodParticlePositions[i * 3] += this.bloodParticleVelocities[i].x * delta;
        this.bloodParticlePositions[i * 3 + 1] += this.bloodParticleVelocities[i].y * delta;
        this.bloodParticlePositions[i * 3 + 2] += this.bloodParticleVelocities[i].z * delta;

        // Gravity
        this.bloodParticleVelocities[i].y -= 9.8 * delta;

        if (this.bloodParticlePositions[i * 3 + 1] <= 0) {
          this.bloodParticleActive[i] = false;
        }
      }
    }
    this.bloodParticleGeo.attributes.position.needsUpdate = true;
  }

  // ==========================================
  // SELF-DRIVING AI & EXTRACTION LOGIC
  // ==========================================
  public callGoldenEagle(pickupPosition: THREE.Vector3) {
    this.currentDestination = pickupPosition.clone();
    this.currentState = 'dispatching';
    this.isDoorsLocked = true;
    if (this.onEvent) {
      this.onEvent('🦅 GOLDEN EAGLE EXTRACTION VEHICLE EN ROUTE TO YOUR POSITION!');
    }
  }

  public boardVehicle(playerId: string): boolean {
    if (this.isDoorsLocked || this.passengersInside.length >= this.maxPassengerCapacity) {
      return false;
    }

    if (!this.passengersInside.includes(playerId)) {
      this.passengersInside.push(playerId);
    }

    if (this.onEvent) {
      this.onEvent(`🚪 PASSENGER BOARDED GOLDEN EAGLE (${this.passengersInside.length}/${this.maxPassengerCapacity})`);
    }

    // Auto start escort to safehouse once at least 1 player boards
    this.startEscortToSafehouse();
    return true;
  }

  public startEscortToSafehouse() {
    this.isDoorsLocked = true;
    this.currentState = 'escorting';
    this.currentDestination = this.safehouseDestination.clone();
    if (this.onEvent) {
      this.onEvent('⚡ GOLDEN EAGLE EVACUATING SURVIVORS TO SAFEHOUSE!');
    }
  }

  public unloadAllPassengers() {
    this.passengersInside = [];
    this.isDoorsLocked = false;
    this.currentState = 'idle';
    if (this.onEvent) {
      this.onEvent('✅ SURVIVORS SAFELY DISCHARGED AT SAFEHOUSE!');
    }
  }

  public update(delta: number, timeSeconds: number, creatures: Creature[], playerPos: THREE.Vector3) {
    // 1. Spectral Headlights Intensity Pulsing
    this.spectralHeadlights.forEach((hl) => {
      hl.intensity = 3.5 + Math.sin(timeSeconds * 4) * 0.5;
    });

    // 2. Hydraulic Anim Cooldown
    if (this.isHydraulicsActive) {
      this.hydraulicAnimTimer -= delta;
      if (this.hydraulicAnimTimer <= 0) {
        this.isHydraulicsActive = false;
        // Lower wheels back to base suspension height
        this.wheelMounts.forEach((wm) => {
          wm.position.y = this.baseSuspensionHeight;
        });
      }
    }

    // 3. AI Driving State Behavior
    switch (this.currentState) {
      case 'dispatching':
        if (this.currentDestination) {
          this.driveTowards(this.currentDestination, delta);
          const dist = this.group.position.distanceTo(this.currentDestination);
          if (dist <= 4.5) {
            this.currentState = 'waiting_for_boarding';
            this.isDoorsLocked = false;
            if (this.onEvent) {
              this.onEvent('🦅 GOLDEN EAGLE ARRIVED - HOP IN!');
            }
          }
        }
        break;

      case 'waiting_for_boarding':
        if (this.passengersInside.length > 0) {
          this.startEscortToSafehouse();
        }
        break;

      case 'escorting':
        this.driveTowards(this.safehouseDestination, delta);
        const distSafehouse = this.group.position.distanceTo(this.safehouseDestination);
        if (distSafehouse <= 5.0) {
          this.unloadAllPassengers();
        }
        break;

      case 'idle':
        // Stationary idle mode
        break;
    }

    // 4. Front Blade Collision Checks
    if (this.currentState === 'dispatching' || this.currentState === 'escorting' || this.isHydraulicsActive) {
      this.checkBladeCollisions(creatures);
    }

    // 5. Update Blood Particles
    this.updateBloodParticles(delta);

    // Sync 3D Group Transform
    this.group.position.copy(this.position);
    this.group.rotation.y = this.rotation;
  }

  private driveTowards(target: THREE.Vector3, delta: number) {
    const dx = target.x - this.position.x;
    const dz = target.z - this.position.z;
    const targetAngle = Math.atan2(dx, dz);

    // Smooth turn rotation interpolation
    let diff = targetAngle - this.rotation;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    const turnStep = this.turnRadius * delta;
    if (Math.abs(diff) < turnStep) {
      this.rotation = targetAngle;
    } else {
      this.rotation += Math.sign(diff) * turnStep;
    }

    // Forward drive movement
    const forward = new THREE.Vector3(Math.sin(this.rotation), 0, Math.cos(this.rotation));
    this.position.addScaledVector(forward, this.driveSpeed * delta);
  }

  public getHUDStatusText(): string | null {
    switch (this.currentState) {
      case 'dispatching':
        return ' [GOLDEN EAGLE EN ROUTE TO RESCUE YOU] ';
      case 'waiting_for_boarding':
        return ' [GOLDEN EAGLE ARRIVED - HOP IN!] ';
      case 'escorting':
        return ` [EVACUATING TO SAFEHOUSE | PASSENGERS: ${this.passengersInside.length}/${this.maxPassengerCapacity}] [PRESS SPACEBAR TO TRIGGER HYDRAULICS] `;
      default:
        return null;
    }
  }

  public dispose() {
    this.scene.remove(this.group);
    this.scene.remove(this.bloodParticles);
  }
}
