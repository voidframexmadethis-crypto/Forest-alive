import * as THREE from 'three';

export type MaterialProfileType = 
  | 'SKIN'
  | 'HAIR'
  | 'CLOTH'
  | 'METAL'
  | 'WOOD'
  | 'BONE'
  | 'TEETH'
  | 'WET_SURFACE'
  | 'DIRT'
  | 'MUD';

export interface MaterialProfileSettings {
  roughness: number;
  metalness: number;
  roughnessMapFactor?: number;
  metalnessMapFactor?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  emissiveColor?: number;
  emissiveIntensity?: number;
  aoMapIntensity?: number;
  normalScale?: { x: number; y: number };
}

export const MATERIAL_PROFILES: Record<MaterialProfileType, MaterialProfileSettings> = {
  SKIN: {
    roughness: 0.75,
    metalness: 0.05,
    aoMapIntensity: 1.2,
    normalScale: { x: 1.2, y: 1.2 }
  },
  HAIR: {
    roughness: 0.9,
    metalness: 0.02,
    normalScale: { x: 0.8, y: 0.8 }
  },
  CLOTH: {
    roughness: 0.85,
    metalness: 0.0,
    normalScale: { x: 1.0, y: 1.0 }
  },
  METAL: {
    roughness: 0.25,
    metalness: 0.85,
    normalScale: { x: 1.5, y: 1.5 }
  },
  WOOD: {
    roughness: 0.8,
    metalness: 0.05,
    normalScale: { x: 1.1, y: 1.1 }
  },
  BONE: {
    roughness: 0.6,
    metalness: 0.05,
    normalScale: { x: 1.0, y: 1.0 }
  },
  TEETH: {
    roughness: 0.3,
    metalness: 0.05,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
    normalScale: { x: 0.5, y: 0.5 }
  },
  WET_SURFACE: {
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    normalScale: { x: 1.8, y: 1.8 }
  },
  DIRT: {
    roughness: 0.95,
    metalness: 0.0,
    normalScale: { x: 1.4, y: 1.4 }
  },
  MUD: {
    roughness: 0.45,
    metalness: 0.05,
    clearcoat: 0.5,
    clearcoatRoughness: 0.3,
    normalScale: { x: 1.6, y: 1.6 }
  }
};

export class MaterialProfileManager {
  public static applyProfile(mesh: THREE.Mesh, profileType: MaterialProfileType) {
    if (!mesh || !mesh.material) return;

    const profile = MATERIAL_PROFILES[profileType];
    if (!profile) return;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    materials.forEach((mat) => {
      if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
        const pbrMat = mat as THREE.MeshStandardMaterial;
        pbrMat.roughness = profile.roughness;
        pbrMat.metalness = profile.metalness;

        if (profile.aoMapIntensity !== undefined && pbrMat.aoMap) {
          pbrMat.aoMapIntensity = profile.aoMapIntensity;
        }

        if (profile.normalScale && pbrMat.normalMap) {
          pbrMat.normalScale.set(profile.normalScale.x, profile.normalScale.y);
        }

        if (profile.emissiveColor !== undefined) {
          pbrMat.emissive.setHex(profile.emissiveColor);
          pbrMat.emissiveIntensity = profile.emissiveIntensity || 1.0;
        }

        pbrMat.needsUpdate = true;
      }
    });
  }
}
