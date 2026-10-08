import * as THREE from 'three';
import { CharacterMeshParts } from './characterMesh';

export type MovementState = 
  | 'idle' 
  | 'walk' 
  | 'run' 
  | 'sprint' 
  | 'crouch' 
  | 'turn' 
  | 'jump' 
  | 'land' 
  | 'interact';

export class CharacterRigController {
  public parts: CharacterMeshParts;
  public state: MovementState = 'idle';
  private animTimer: number = 0;
  private breathTimer: number = Math.random() * Math.PI * 2;
  private currentSpeed: number = 0;
  private targetSpeed: number = 0;

  // 3D Weapon Attached to 3rd-Person Model
  public weaponSocket: THREE.Group = new THREE.Group();
  public currentWeaponId: string = 'm4a1';

  // Weapon Switch state
  public isSwitching: boolean = false;
  private switchProgress: number = 0;
  private pendingWeaponId: string | null = null;

  // Joint rotation targets for smooth crossfading
  private legLRotX: number = 0;
  private legRRotX: number = 0;

  constructor(parts: CharacterMeshParts) {
    this.parts = parts;

    // Attach weapon socket to chest so weapon moves with upper torso
    this.parts.chest.add(this.weaponSocket);
    this.weaponSocket.position.set(0.18, 0.1, -0.32);
    this.build3DWeaponMesh(this.currentWeaponId);
  }

  public setEquippedWeapon(weaponId: string) {
    if (this.currentWeaponId === weaponId) return;
    this.isSwitching = true;
    this.switchProgress = 0;
    this.pendingWeaponId = weaponId;
  }

  public build3DWeaponMesh(weaponId: string) {
    this.currentWeaponId = weaponId;
    while (this.weaponSocket.children.length > 0) {
      this.weaponSocket.remove(this.weaponSocket.children[0]);
    }

    const gunMat = new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.4, metalness: 0.8 });
    const gunGroup = new THREE.Group();

    if (weaponId === 'm4a1') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.5), gunMat);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4), gunMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -0.4);

      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.08), gunMat);
      mag.position.set(0, -0.12, -0.1);
      mag.rotation.x = -0.2;

      const sight = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08), new THREE.MeshStandardMaterial({ color: 0x222222 }));
      sight.rotation.x = Math.PI / 2;
      sight.position.set(0, 0.08, -0.1);

      gunGroup.add(body, barrel, mag, sight);
    } else if (weaponId === 'ak47') {
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.5, metalness: 0.85 });
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3311, roughness: 0.8, metalness: 0.1 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.48), steelMat);
      const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.22), woodMat);
      handguard.position.set(0, -0.01, -0.2);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.42), steelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -0.42);

      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.09), steelMat);
      mag.position.set(0, -0.15, -0.1);
      mag.rotation.x = -0.35;

      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.13, 0.32), woodMat);
      stock.position.set(0, -0.04, 0.32);

      gunGroup.add(body, handguard, barrel, mag, stock);
    } else if (weaponId === 'shotgun') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.65), gunMat);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55), gunMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.03, -0.45);

      const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22), new THREE.MeshStandardMaterial({ color: 0x3e2a1e }));
      pump.rotation.x = Math.PI / 2;
      pump.position.set(0, 0.01, -0.35);

      gunGroup.add(body, barrel, pump);
    } else if (weaponId === 'sniper') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.8), gunMat);
      const longBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.75), gunMat);
      longBarrel.rotation.x = Math.PI / 2;
      longBarrel.position.set(0, 0.03, -0.65);

      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.28), new THREE.MeshStandardMaterial({ color: 0x0a0a0d }));
      scope.rotation.x = Math.PI / 2;
      scope.position.set(0, 0.11, -0.2);

      gunGroup.add(body, longBarrel, scope);
    } else if (weaponId === 'smoke_grenade' || weaponId === 'grenade') {
      const canisterMat = new THREE.MeshStandardMaterial({ color: weaponId === 'smoke_grenade' ? 0x2e6f40 : 0x3b4a28, roughness: 0.5 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12), canisterMat);
      gunGroup.add(body);
    } else {
      // Minigun
      const barrels = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6), gunMat);
        b.rotation.x = Math.PI / 2;
        b.position.set(Math.cos(angle) * 0.04, Math.sin(angle) * 0.04, -0.4);
        barrels.add(b);
      }
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4), gunMat);
      body.rotation.x = Math.PI / 2;
      gunGroup.add(body, barrels);
    }

    this.weaponSocket.add(gunGroup);
  }

  public setState(newState: MovementState) {
    this.state = newState;
  }

  public update(
    delta: number, 
    speed: number, 
    isTurning: number = 0, 
    lookDirection?: THREE.Vector3,
    isAiming: boolean = false,
    isSprinting: boolean = false
  ) {
    this.animTimer += delta * (speed > 0 ? (isSprinting ? speed * 2.5 : speed * 1.8) : 2.0);
    this.breathTimer += delta * 2.2;

    this.targetSpeed = speed;
    this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, this.targetSpeed, delta * 8.0);

    // Weapon switching animation in 3rd person
    let switchOffsetZ = 0;
    let switchOffsetY = 0;
    if (this.isSwitching) {
      this.switchProgress += delta * 3.5;
      if (this.switchProgress < 0.4) {
        switchOffsetY = -0.25 * (this.switchProgress / 0.4);
        switchOffsetZ = 0.1 * (this.switchProgress / 0.4);
      } else if (this.switchProgress < 0.5) {
        if (this.pendingWeaponId) {
          this.build3DWeaponMesh(this.pendingWeaponId);
          this.pendingWeaponId = null;
        }
        switchOffsetY = -0.25;
        switchOffsetZ = 0.1;
      } else if (this.switchProgress < 1.0) {
        const t = (this.switchProgress - 0.5) / 0.5;
        switchOffsetY = THREE.MathUtils.lerp(-0.25, 0, t);
        switchOffsetZ = THREE.MathUtils.lerp(0.1, 0, t);
      } else {
        this.isSwitching = false;
      }
    }

    // 1. CHEST BREATHING & TWO-HANDED WEAPON HOLDING POSTURE
    const breathOffset = Math.sin(this.breathTimer) * 0.008;
    this.parts.chest.scale.set(1.0 + breathOffset, 1.0 + breathOffset, 1.0 + breathOffset);

    // Two-handed stance arm angles
    let targetArmRRotX = -Math.PI / 2.8;
    let targetArmRRotY = -0.25;
    let targetArmRRotZ = 0.1;

    let targetArmLRotX = -Math.PI / 2.6;
    let targetArmLRotY = 0.55; // Crossed across chest to grip foreguard
    let targetArmLRotZ = -0.2;

    if (isSprinting) {
      // Sprint low-ready carry pose
      targetArmRRotX = -Math.PI / 4;
      targetArmLRotX = -Math.PI / 4;
    } else if (isAiming) {
      // ADS high ready precision stance
      targetArmRRotX = -Math.PI / 2.2;
      targetArmLRotX = -Math.PI / 2.1;
    }

    if (this.currentSpeed < 0.2) {
      // Idle gait
      this.legLRotX = THREE.MathUtils.lerp(this.legLRotX, Math.sin(this.breathTimer * 0.5) * 0.03, delta * 5.0);
      this.legRRotX = THREE.MathUtils.lerp(this.legRRotX, -Math.sin(this.breathTimer * 0.5) * 0.03, delta * 5.0);
    } else {
      // Locomotion gait
      const strideAngle = Math.sin(this.animTimer * 1.5) * Math.min(0.65, this.currentSpeed * 0.12);
      this.legLRotX = strideAngle;
      this.legRRotX = -strideAngle;
    }

    // Apply joint rotations
    this.parts.legL.rotation.x = this.legLRotX;
    this.parts.legR.rotation.x = this.legRRotX;

    // Apply two-handed arm rotations
    this.parts.armR.rotation.set(
      THREE.MathUtils.lerp(this.parts.armR.rotation.x, targetArmRRotX, delta * 12.0),
      THREE.MathUtils.lerp(this.parts.armR.rotation.y, targetArmRRotY, delta * 12.0),
      THREE.MathUtils.lerp(this.parts.armR.rotation.z, targetArmRRotZ, delta * 12.0)
    );

    this.parts.armL.rotation.set(
      THREE.MathUtils.lerp(this.parts.armL.rotation.x, targetArmLRotX, delta * 12.0),
      THREE.MathUtils.lerp(this.parts.armL.rotation.y, targetArmLRotY, delta * 12.0),
      THREE.MathUtils.lerp(this.parts.armL.rotation.z, targetArmLRotZ, delta * 12.0)
    );

    // Apply weapon socket offset
    this.weaponSocket.position.set(0.18, 0.1 + switchOffsetY, -0.32 + switchOffsetZ);

    // Head look tracking
    if (lookDirection) {
      this.parts.head.rotation.y = THREE.MathUtils.lerp(this.parts.head.rotation.y, lookDirection.x * 0.5, delta * 6.0);
      this.parts.head.rotation.x = THREE.MathUtils.lerp(this.parts.head.rotation.x, lookDirection.y * 0.4, delta * 6.0);
    }
  }

  public getRootGroup(): THREE.Group {
    return this.parts.group;
  }
}
