import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AssetValidator, AssetValidationResult } from './AssetValidation';

export interface LoadProgressCallback {
  (progressPercent: number, loadedBytes: number, totalBytes: number): void;
}

export class AssetManager {
  private static gltfLoader = new GLTFLoader();
  private static textureLoader = new THREE.TextureLoader();
  private static gltfCache: Map<string, Promise<any>> = new Map();
  private static textureCache: Map<string, Promise<THREE.Texture>> = new Map();
  private static validationResults: Map<string, AssetValidationResult> = new Map();

  public static async loadGLTF(url: string, onProgress?: LoadProgressCallback): Promise<any> {
    if (this.gltfCache.has(url)) {
      return this.gltfCache.get(url)!;
    }

    const loadPromise = new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          // Validate loaded GLTF asset structure
          const validation = AssetValidator.validateGLTF(gltf);
          this.validationResults.set(url, validation);

          if (!validation.isValid) {
            console.warn(`[AssetManager] Asset validation warning for ${url}:`, validation.errors);
          } else {
            console.log(`[AssetManager] Successfully loaded & validated GLTF asset: ${url}`);
          }

          resolve(gltf);
        },
        (xhr) => {
          if (xhr.total > 0 && onProgress) {
            const pct = Math.round((xhr.loaded / xhr.total) * 100);
            onProgress(pct, xhr.loaded, xhr.total);
          }
        },
        (error) => {
          console.warn(`[AssetManager] GLTF asset unavailable or failed at ${url}. Triggering procedural fallback.`);
          this.gltfCache.delete(url); // Evict failed promise from cache
          reject(error);
        }
      );
    });

    this.gltfCache.set(url, loadPromise);
    return loadPromise;
  }

  public static async loadTexture(url: string): Promise<THREE.Texture> {
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url)!;
    }

    const loadPromise = new Promise<THREE.Texture>((resolve, reject) => {
      this.textureLoader.load(
        url,
        (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          resolve(tex);
        },
        undefined,
        (err) => {
          console.error(`[AssetManager] Error loading texture from ${url}:`, err);
          this.textureCache.delete(url);
          reject(err);
        }
      );
    });

    this.textureCache.set(url, loadPromise);
    return loadPromise;
  }

  public static isCached(url: string): boolean {
    return this.gltfCache.has(url);
  }

  public static getValidationResult(url: string): AssetValidationResult | undefined {
    return this.validationResults.get(url);
  }

  public static dispose() {
    this.gltfCache.clear();
    this.textureCache.clear();
    this.validationResults.clear();
  }
}
