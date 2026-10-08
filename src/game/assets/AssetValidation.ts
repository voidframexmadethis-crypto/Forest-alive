import * as THREE from 'three';

export interface AssetValidationResult {
  isValid: boolean;
  fileFormat: 'GLB' | 'GLTF' | 'UNKNOWN';
  hasScene: boolean;
  hasMeshes: boolean;
  meshCount: number;
  hasSkeleton: boolean;
  boneCount: number;
  hasAnimations: boolean;
  animationClips: string[];
  hasMaterials: boolean;
  materialNames: string[];
  errors: string[];
  warnings: string[];
}

export class AssetValidator {
  public static validateGLTF(gltfData: any): AssetValidationResult {
    const result: AssetValidationResult = {
      isValid: false,
      fileFormat: 'UNKNOWN',
      hasScene: false,
      hasMeshes: false,
      meshCount: 0,
      hasSkeleton: false,
      boneCount: 0,
      hasAnimations: false,
      animationClips: [],
      hasMaterials: false,
      materialNames: [],
      errors: [],
      warnings: []
    };

    if (!gltfData) {
      result.errors.push('GLTF data is null or undefined.');
      return result;
    }

    // Check scene graph
    if (gltfData.scene && gltfData.scene.isObject3D) {
      result.hasScene = true;
      result.fileFormat = 'GLB'; // or GLTF
    } else {
      result.errors.push('Missing root Object3D scene in GLTF payload.');
    }

    // Traverse model graph
    if (result.hasScene) {
      const materialSet = new Set<string>();
      let meshes = 0;
      let bones = 0;

      gltfData.scene.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          meshes++;
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => materialSet.add(mat.name || mat.type));
            } else {
              materialSet.add(mesh.material.name || mesh.material.type);
            }
          }
        }

        if ((child as THREE.Bone).isBone) {
          bones++;
        }
      });

      result.meshCount = meshes;
      result.hasMeshes = meshes > 0;
      result.boneCount = bones;
      result.hasSkeleton = bones > 0;
      result.materialNames = Array.from(materialSet);
      result.hasMaterials = materialSet.size > 0;

      if (!result.hasMeshes) {
        result.warnings.push('Scene graph contains 0 meshes.');
      }
    }

    // Inspect animation clips
    if (gltfData.animations && Array.isArray(gltfData.animations) && gltfData.animations.length > 0) {
      result.hasAnimations = true;
      result.animationClips = gltfData.animations.map((clip: THREE.AnimationClip) => clip.name || 'unnamed_clip');
    } else {
      result.warnings.push('No skeletal animation clips detected in GLTF file.');
    }

    result.isValid = result.hasScene && result.hasMeshes;
    return result;
  }
}
