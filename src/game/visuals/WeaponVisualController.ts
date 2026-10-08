import * as THREE from 'three';
import { AssetManager } from '../assets/AssetManager';
import { WEAPON_ASSET_REGISTRY, WeaponAssetConfig } from '../assets/AssetRegistry';
import { MaterialProfileManager } from '../assets/MaterialProfiles';

export type ReloadStage = 
  | 'IDLE'
  | 'LOWERING'
  | 'HAND_MOVE'
  | 'MAG_REMOVE'
  | 'MAG_EJECT'
  | 'MAG_RETRIEVE'
  | 'MAG_INSERT'
  | 'BOLT_MANIPULATE'
  | 'READYING';

export class WeaponVisualController {
  private weaponType: string;
  private config: WeaponAssetConfig;
  private weaponGroup: THREE.Group = new THREE.Group();
  private magazineMesh: THREE.Object3D | null = null;
  private muzzleFlashPoint: THREE.Vector3 = new THREE.Vector3();

  // Reload state machine
  private currentReloadStage: ReloadStage = 'IDLE';
  private reloadProgress: number = 0;
  private isReloading: boolean = false;
  private isUsingImportedModel: boolean = false;

  constructor(weaponType: string) {
    this.weaponType = weaponType;
    this.config = WEAPON_ASSET_REGISTRY[weaponType] || {
      id: weaponType,
      name: weaponType,
      category: 'Gun',
      scale: { x: 1, y: 1, z: 1 },
      positionOffset: { x: 0.22, y: -0.2, z: -0.45 },
      rotationOffset: { x: 0, y: 0, z: 0 },
      materialProfile: 'METAL',
      sockets: {
        weapon: { x: 0, y: 0, z: 0 },
        dominantHand: { x: 0, y: -0.05, z: 0.1 },
        supportHand: { x: 0, y: -0.02, z: -0.2 },
        magazine: { x: 0, y: -0.12, z: -0.1 },
        muzzle: { x: 0, y: 0.02, z: -0.5 },
        sights: { x: 0, y: 0.08, z: -0.1 }
      },
      reloadSequence: ['lower_weapon', 'eject_mag', 'insert_mag', 'ready_weapon']
    };
  }

  public async initialize(proceduralFallbackGenerator: () => THREE.Group): Promise<THREE.Group> {
    if (this.config.modelPath) {
      try {
        const gltf = await AssetManager.loadGLTF(this.config.modelPath);
        if (gltf && gltf.scene) {
          const model = gltf.scene.clone() as THREE.Group;
          model.scale.set(this.config.scale.x, this.config.scale.y, this.config.scale.z);
          
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              MaterialProfileManager.applyProfile(mesh, this.config.materialProfile);

              if (mesh.name.toLowerCase().includes('mag') || mesh.name.toLowerCase().includes('clip')) {
                this.magazineMesh = mesh;
              }
            }
          });

          this.weaponGroup.add(model);
          this.isUsingImportedModel = true;
          return this.weaponGroup;
        }
      } catch (err) {
        console.warn(`[WeaponVisualController] Could not load model for ${this.weaponType}, using procedural fallback.`, err);
      }
    }

    // Procedural Fallback
    const proceduralGroup = proceduralFallbackGenerator();
    this.weaponGroup.add(proceduralGroup);
    this.isUsingImportedModel = false;
    return this.weaponGroup;
  }

  public triggerReload(durationMs: number) {
    if (this.isReloading) return;
    this.isReloading = true;
    this.reloadProgress = 0;
    this.currentReloadStage = 'LOWERING';
  }

  public update(delta: number) {
    if (!this.isReloading) return;

    this.reloadProgress += delta * 1.8;

    // Multi-stage Reload State Machine Sequence
    if (this.reloadProgress < 0.15) {
      this.currentReloadStage = 'LOWERING';
      this.weaponGroup.rotation.x = THREE.MathUtils.lerp(0, -0.4, this.reloadProgress / 0.15);
      this.weaponGroup.position.y = THREE.MathUtils.lerp(-0.2, -0.32, this.reloadProgress / 0.15);
    } else if (this.reloadProgress < 0.35) {
      this.currentReloadStage = 'MAG_REMOVE';
      if (this.magazineMesh) {
        this.magazineMesh.position.y = THREE.MathUtils.lerp(0, -0.15, (this.reloadProgress - 0.15) / 0.2);
      }
    } else if (this.reloadProgress < 0.55) {
      this.currentReloadStage = 'MAG_RETRIEVE';
      if (this.magazineMesh) {
        this.magazineMesh.position.y = -0.15;
      }
    } else if (this.reloadProgress < 0.8) {
      this.currentReloadStage = 'MAG_INSERT';
      if (this.magazineMesh) {
        this.magazineMesh.position.y = THREE.MathUtils.lerp(-0.15, 0, (this.reloadProgress - 0.55) / 0.25);
      }
    } else if (this.reloadProgress < 1.0) {
      this.currentReloadStage = 'BOLT_MANIPULATE';
      this.weaponGroup.rotation.z = Math.sin((this.reloadProgress - 0.8) * Math.PI * 5) * 0.08;
    } else {
      this.currentReloadStage = 'READYING';
      this.weaponGroup.rotation.set(0, 0, 0);
      this.weaponGroup.position.set(this.config.positionOffset.x, this.config.positionOffset.y, this.config.positionOffset.z);
      if (this.magazineMesh) this.magazineMesh.position.set(0, 0, 0);
      this.isReloading = false;
      this.currentReloadStage = 'IDLE';
    }
  }

  public getSockets() {
    return this.config.sockets;
  }

  public getCurrentReloadStage(): ReloadStage {
    return this.currentReloadStage;
  }
}
