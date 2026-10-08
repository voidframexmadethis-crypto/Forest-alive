import * as THREE from 'three';
import { AssetManager } from './AssetManager';
import { MaterialProfileManager, MaterialProfileType } from './MaterialProfiles';

export interface PropInstance {
  type: string;
  position: THREE.Vector3;
  scale?: THREE.Vector3;
  rotationY?: number;
}

export class EnvironmentAssetManager {
  private static scene: THREE.Scene;
  private static cachedModels: Map<string, THREE.Group> = new Map();

  public static initialize(scene: THREE.Scene) {
    this.scene = scene;
  }

  public static async loadAndPlaceProp(
    type: string,
    modelUrl: string,
    position: THREE.Vector3,
    materialProfile: MaterialProfileType = 'WOOD',
    fallbackGenerator?: () => THREE.Group
  ): Promise<THREE.Group> {
    let baseGroup: THREE.Group | undefined = this.cachedModels.get(type);

    if (!baseGroup && modelUrl) {
      try {
        const gltf = await AssetManager.loadGLTF(modelUrl);
        if (gltf && gltf.scene) {
          baseGroup = gltf.scene as THREE.Group;
          baseGroup.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              MaterialProfileManager.applyProfile(mesh, materialProfile);
            }
          });
          this.cachedModels.set(type, baseGroup);
        }
      } catch (err) {
        console.warn(`[EnvironmentAssetManager] Failed to load ${modelUrl}, using fallback.`, err);
      }
    }

    let instance: THREE.Group;
    if (baseGroup) {
      instance = baseGroup.clone() as THREE.Group;
    } else if (fallbackGenerator) {
      instance = fallbackGenerator();
    } else {
      instance = new THREE.Group();
    }

    instance.position.copy(position);
    if (this.scene) this.scene.add(instance);
    return instance;
  }
}
