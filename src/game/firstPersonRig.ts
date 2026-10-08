import * as THREE from 'three';

export interface HandGripTarget {
  handRPos: THREE.Vector3;
  handLPos: THREE.Vector3;
  weaponPosOffset: THREE.Vector3;
  weaponRotOffset: THREE.Vector3;
}

export class FirstPersonRigController {
  private camera: THREE.PerspectiveCamera;
  public fpsGroup: THREE.Group = new THREE.Group();
  public weaponSocket: THREE.Group = new THREE.Group();
  
  // Hands
  private handLGroup: THREE.Group = new THREE.Group();
  private handRGroup: THREE.Group = new THREE.Group();
  private handLMesh: THREE.Mesh;
  private handRMesh: THREE.Mesh;

  // Arms
  private armLMesh: THREE.Mesh;
  private armRMesh: THREE.Mesh;
  private shoulderLPos = new THREE.Vector3(-0.24, -0.20, -0.15);
  private shoulderRPos = new THREE.Vector3(0.24, -0.20, -0.15);

  // Active Category Grip Targets
  private currentHandLPos = new THREE.Vector3(-0.12, -0.18, -0.55);
  private currentHandRPos = new THREE.Vector3(0.14, -0.18, -0.36);
  private targetHandLPos = new THREE.Vector3(-0.12, -0.18, -0.55);
  private targetHandRPos = new THREE.Vector3(0.14, -0.18, -0.36);

  // Sway & Recoil vectors
  private swayOffset = new THREE.Vector3();
  private recoilOffset = new THREE.Vector3();
  private recoilRot = new THREE.Vector3();
  private bobTime: number = 0;

  // Multi-stage Reload visual offsets
  public isReloading: boolean = false;
  private reloadProgress: number = 0;

  // Smooth Weapon Switching
  public isSwitching: boolean = false;
  private switchProgress: number = 0;
  private pendingSwapCallback: (() => void) | null = null;
  private switchCategory: string = 'm4a1';

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd2997a, roughness: 0.65, metalness: 0.05 });
    const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 }); // Tactical sleeve

    // Left Arm & Hand with Fingers
    this.armLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 1, 10), sleeveMat);
    this.armLMesh.castShadow = true;

    this.handLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.07, 0.035), skinMat);
    this.handLGroup.add(this.handLMesh);
    // Add 4 fingers & thumb to left hand
    for (let f = 0; f < 4; f++) {
      const finger = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.05, 0.014), skinMat);
      finger.position.set(-0.024 + f * 0.016, -0.045, -0.01);
      finger.rotation.x = 0.5; // Gripping curve
      this.handLGroup.add(finger);
    }
    const thumbL = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.045, 0.016), skinMat);
    thumbL.position.set(-0.038, -0.02, 0.015);
    thumbL.rotation.z = -0.4;
    this.handLGroup.add(thumbL);

    // Right Arm & Hand with Fingers
    this.armRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 1, 10), sleeveMat);
    this.armRMesh.castShadow = true;

    this.handRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.07, 0.035), skinMat);
    this.handRGroup.add(this.handRMesh);
    // Add 4 fingers & thumb to right hand
    for (let f = 0; f < 4; f++) {
      const finger = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.05, 0.014), skinMat);
      finger.position.set(-0.024 + f * 0.016, -0.045, -0.01);
      finger.rotation.x = 0.5; // Gripping curve
      this.handRGroup.add(finger);
    }
    const thumbR = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.045, 0.016), skinMat);
    thumbR.position.set(0.038, -0.02, 0.015);
    thumbR.rotation.z = 0.4;
    this.handRGroup.add(thumbR);

    // Socket where weapon model is attached
    this.weaponSocket.position.set(0, 0, 0);

    this.fpsGroup.add(this.armLMesh, this.handLGroup, this.armRMesh, this.handRGroup, this.weaponSocket);
    this.camera.add(this.fpsGroup);

    this.setWeaponCategoryProfile('m4a1');
  }

  public setWeaponCategoryProfile(weaponId: string) {
    if (weaponId === 'm4a1' || weaponId === 'ak47') {
      this.targetHandRPos.set(0.14, -0.18, -0.36);
      this.targetHandLPos.set(-0.12, -0.16, -0.58);
    } else if (weaponId === 'shotgun') {
      this.targetHandRPos.set(0.14, -0.18, -0.34);
      this.targetHandLPos.set(-0.12, -0.17, -0.62);
    } else if (weaponId === 'sniper') {
      this.targetHandRPos.set(0.14, -0.18, -0.32);
      this.targetHandLPos.set(-0.12, -0.17, -0.72);
    } else if (weaponId === 'minigun') {
      this.targetHandRPos.set(0.10, -0.10, -0.30);
      this.targetHandLPos.set(-0.14, -0.22, -0.52);
    } else if (weaponId === 'smoke_grenade' || weaponId === 'grenade') {
      this.targetHandRPos.set(0.12, -0.16, -0.36);
      this.targetHandLPos.set(-0.12, -0.18, -0.38);
    }
  }

  public triggerSwitch(nextWeaponId: string, onSwapCallback: () => void) {
    if (this.isSwitching) {
      if (this.pendingSwapCallback) this.pendingSwapCallback();
    }
    this.isSwitching = true;
    this.switchProgress = 0;
    this.switchCategory = nextWeaponId;
    this.pendingSwapCallback = onSwapCallback;
  }

  public triggerRecoil(recoilAmount: number) {
    this.recoilOffset.z = recoilAmount * 0.12;
    this.recoilRot.x = recoilAmount * 0.15;
    this.recoilRot.y = (Math.random() - 0.5) * recoilAmount * 0.05;
  }

  public triggerReload() {
    this.isReloading = true;
    this.reloadProgress = 0;
  }

  public update(
    delta: number, 
    speed: number, 
    mouseSwayX: number, 
    mouseSwayY: number, 
    isAiming: boolean = false,
    isSprinting: boolean = false
  ) {
    this.bobTime += delta * (speed > 0 ? (isSprinting ? speed * 2.2 : speed * 1.6) : 1.5);

    // Smoothly interpolate current hand grip positions to target category grip
    this.currentHandLPos.lerp(this.targetHandLPos, delta * 10.0);
    this.currentHandRPos.lerp(this.targetHandRPos, delta * 10.0);

    // 1. MOUSE LOOK SWAY & WEAPON INERTIA
    const swayXTarget = -mouseSwayX * (isAiming ? 0.01 : 0.04);
    const swayYTarget = -mouseSwayY * (isAiming ? 0.01 : 0.04);
    this.swayOffset.x = THREE.MathUtils.lerp(this.swayOffset.x, swayXTarget, delta * 12.0);
    this.swayOffset.y = THREE.MathUtils.lerp(this.swayOffset.y, swayYTarget, delta * 12.0);

    // 2. BREATHING & WALKING BOB
    const bobX = Math.cos(this.bobTime * 0.5) * (speed > 0 ? (isSprinting ? 0.035 : 0.015) : 0.005);
    const bobY = Math.sin(this.bobTime) * (speed > 0 ? (isSprinting ? 0.045 : 0.02) : 0.006);

    // 3. RECOIL DECAY
    this.recoilOffset.multiplyScalar(Math.exp(-delta * 14.0));
    this.recoilRot.multiplyScalar(Math.exp(-delta * 14.0));

    // 4. WEAPON SWITCHING ANIMATION (Lower -> Swap -> Raise)
    let switchOffsetY = 0;
    let switchRotZ = 0;
    let switchRotX = 0;

    if (this.isSwitching) {
      this.switchProgress += delta * 3.5; // ~0.28 seconds transition

      if (this.switchProgress < 0.4) {
        // Stage 1: Lower weapon & tilt away
        const t = this.switchProgress / 0.4;
        switchOffsetY = -0.35 * t;
        switchRotZ = 0.35 * t;
        switchRotX = -0.4 * t;
      } else if (this.switchProgress < 0.5) {
        // Midpoint: Perform actual model swap callback
        if (this.pendingSwapCallback) {
          this.pendingSwapCallback();
          this.pendingSwapCallback = null;
          this.setWeaponCategoryProfile(this.switchCategory);
        }
        switchOffsetY = -0.35;
        switchRotZ = 0.35;
        switchRotX = -0.4;
      } else if (this.switchProgress < 1.0) {
        // Stage 2: Raise new weapon smoothly into 2-handed ready position
        const t = (this.switchProgress - 0.5) / 0.5;
        switchOffsetY = THREE.MathUtils.lerp(-0.35, 0, t);
        switchRotZ = THREE.MathUtils.lerp(0.35, 0, t);
        switchRotX = THREE.MathUtils.lerp(-0.4, 0, t);
      } else {
        this.isSwitching = false;
      }
    }

    // 5. MULTI-STAGE VISUAL RELOAD ANIMATION
    let reloadY = 0;
    let reloadRotZ = 0;
    const handLOffset = new THREE.Vector3(0, 0, 0);
    const handROffset = new THREE.Vector3(0, 0, 0);

    if (this.isReloading) {
      this.reloadProgress += delta * 1.6;

      if (this.reloadProgress < 0.25) {
        // Lower weapon & tilt left
        const t = this.reloadProgress / 0.25;
        reloadY = -0.15 * t;
        reloadRotZ = 0.3 * t;
        handLOffset.y = -0.14 * t; // Left hand reaches down for magazine
      } else if (this.reloadProgress < 0.6) {
        // Left hand inserts fresh mag
        reloadY = -0.15;
        reloadRotZ = 0.3;
        const insertT = (this.reloadProgress - 0.25) / 0.35;
        handLOffset.y = THREE.MathUtils.lerp(-0.25, 0, insertT);
      } else if (this.reloadProgress < 0.85) {
        // Right hand racks bolt
        reloadY = -0.08;
        reloadRotZ = -0.1;
        handROffset.z = Math.sin((this.reloadProgress - 0.6) * Math.PI * 4) * 0.06;
      } else if (this.reloadProgress < 1.0) {
        // Raise weapon back to ready position
        const readyT = (this.reloadProgress - 0.85) / 0.15;
        reloadY = THREE.MathUtils.lerp(-0.08, 0, readyT);
        reloadRotZ = THREE.MathUtils.lerp(-0.1, 0, readyT);
      } else {
        this.isReloading = false;
      }
    }

    // 6. SPRINTING LOW-READY TACTICAL POSITION
    let sprintRotX = 0;
    let sprintRotY = 0;
    let sprintY = 0;
    if (isSprinting && !isAiming) {
      sprintRotX = -0.32;
      sprintRotY = 0.22;
      sprintY = -0.08;
    }

    // 7. AIMING (ADS) TRANSITION
    const aimMult = isAiming ? 0.15 : 1.0;
    const adsOffset = isAiming ? new THREE.Vector3(-0.22, 0.08, 0.12) : new THREE.Vector3(0, 0, 0);

    // Combine all position & rotation vectors
    this.fpsGroup.position.set(
      (this.swayOffset.x + bobX) * aimMult + adsOffset.x,
      (this.swayOffset.y + bobY + reloadY + switchOffsetY + sprintY) * aimMult + adsOffset.y,
      (this.recoilOffset.z) * aimMult + adsOffset.z
    );

    this.fpsGroup.rotation.set(
      this.recoilRot.x * aimMult + switchRotX + sprintRotX,
      this.recoilRot.y * aimMult + sprintRotY,
      reloadRotZ + switchRotZ
    );

    // 8. UPDATE HAND POSITIONS & ARM IK ATTACHMENTS
    // Calculate final world hand targets relative to FPS group
    const finalHandLPos = this.currentHandLPos.clone().add(handLOffset);
    const finalHandRPos = this.currentHandRPos.clone().add(handROffset);

    this.handLGroup.position.copy(finalHandLPos);
    this.handRGroup.position.copy(finalHandRPos);

    // Orient left hand & right hand to grip weapon nicely
    this.handLGroup.rotation.set(0.2, 0.3, -0.2);
    this.handRGroup.rotation.set(-0.1, -0.2, 0.1);

    // Stretch & orient Arm Cylinders between shoulder sockets and hands (IK connection)
    this.connectArmSegment(this.armLMesh, this.shoulderLPos, finalHandLPos);
    this.connectArmSegment(this.armRMesh, this.shoulderRPos, finalHandRPos);
  }

  // Connects arm cylinder mesh cleanly between shoulder origin and hand target
  private connectArmSegment(armMesh: THREE.Mesh, shoulder: THREE.Vector3, hand: THREE.Vector3) {
    const midPoint = new THREE.Vector3().addVectors(shoulder, hand).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(hand, shoulder);
    const length = dir.length();

    armMesh.position.copy(midPoint);
    armMesh.scale.set(1, length, 1);

    // Orient cylinder (default y-axis) along shoulder -> hand direction vector
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
    armMesh.rotation.setFromQuaternion(quaternion);
  }
}
