import * as THREE from 'three';
import { CharacterMeshBuilder, HumanCharacterId } from '../characterMesh';
import { CharacterRigController } from '../characterRig';
import { soundEngine } from '../audio';

export class KatrinaCompanionAI {
  private mesh: THREE.Group;
  private rig: CharacterRigController;
  private playerTarget: THREE.Vector3;
  private babyMesh: THREE.Group;

  constructor(scene: THREE.Scene, startPos: THREE.Vector3) {
    const parts = CharacterMeshBuilder.createHumanCharacter('katrina');
    this.mesh = parts.group;
    this.mesh.position.copy(startPos);
    scene.add(this.mesh);

    this.rig = new CharacterRigController(parts);
    this.playerTarget = startPos.clone();

    // Add protective baby carrier
    this.babyMesh = this.createBabyCarrier();
    parts.chest.add(this.babyMesh);
  }

  private createBabyCarrier(): THREE.Group {
    const group = new THREE.Group();
    const carrierMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    const babyMat = new THREE.MeshStandardMaterial({ color: 0xf5d0c0, roughness: 0.8 });
    
    // Carrier
    const carrier = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 0.1), carrierMat);
    carrier.position.set(0, 0, 0.15);
    group.add(carrier);

    // Baby head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), babyMat);
    head.position.set(0, 0.2, 0.15);
    group.add(head);

    return group;
  }

  public update(delta: number, playerPos: THREE.Vector3, sceneCreatures: any[]) {
    // 1. Follow behavior
    const dist = this.mesh.position.distanceTo(playerPos);
    if (dist > 3) {
      const dir = playerPos.clone().sub(this.mesh.position).normalize();
      this.mesh.position.add(dir.multiplyScalar(delta * 4.0));
      this.mesh.lookAt(playerPos);
      this.rig.update(delta, 4.0, 0, undefined, false, false);
    } else {
      this.rig.update(delta, 0, 0, undefined, false, false);
    }

    // 2. Combat behavior (Simple logic)
    const nearest = sceneCreatures.find(c => c.mesh.position.distanceTo(this.mesh.position) < 10);
    if (nearest) {
      if (Math.random() < 0.01) {
        soundEngine.playCreatureSound('witch_scream'); // Placeholder for unique dialogue
      }
    }
  }

  public dispose(scene: THREE.Scene) {
    scene.remove(this.mesh);
  }
}
