import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { AssetManager } from '../assets/AssetManager';
import { CREATURE_ASSET_REGISTRY, CreatureAssetConfig } from '../assets/AssetRegistry';
import { MaterialProfileManager } from '../assets/MaterialProfiles';
import { AnimationController } from '../assets/AnimationController';

export interface CreatureVisual {
  group: THREE.Group;
  animController?: AnimationController;
  mixer?: THREE.AnimationMixer;
  animations?: THREE.AnimationClip[];
}

export class CreatureVisualController {
  private type: string;
  private proceduralGenerator: (type: any, config: any) => THREE.Group;
  private visual: CreatureVisual | null = null;
  private isUsingImported: boolean = false;
  private currentActionName: string = '';
  private isTransientPlaying: boolean = false;
  private assetConfig: CreatureAssetConfig | null = null;

  constructor(
    type: string,
    proceduralGenerator: (type: any, config: any) => THREE.Group
  ) {
    this.type = type;
    this.proceduralGenerator = proceduralGenerator;
    this.assetConfig = CREATURE_ASSET_REGISTRY[type] || null;
  }

  public async initialize(config: any, importedUrl?: string): Promise<THREE.Group> {
    const urlToLoad = importedUrl || (this.assetConfig ? this.assetConfig.modelPath : undefined);

    if (urlToLoad) {
      try {
        const gltf = await AssetManager.loadGLTF(urlToLoad);
        if (gltf && gltf.scene) {
          // Clone the model graph so each creature instance has its own independent hierarchy & skeleton
          const clonedScene = SkeletonUtils.clone(gltf.scene) as THREE.Group;
          
          const profile = this.assetConfig ? this.assetConfig.materialProfile : 'SKIN';

          // Enable shadow casting, receiving, and apply PBR material profile
          clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              MaterialProfileManager.applyProfile(mesh, profile);
            }
          });

          if (this.assetConfig && this.assetConfig.scale) {
            clonedScene.scale.set(this.assetConfig.scale.x, this.assetConfig.scale.y, this.assetConfig.scale.z);
          }

          const animations = gltf.animations || [];
          const animController = new AnimationController(
            clonedScene,
            animations,
            this.assetConfig ? this.assetConfig.animations : {}
          );

          this.visual = {
            group: clonedScene,
            animController,
            mixer: animController.getMixer(),
            animations
          };

          this.isUsingImported = true;
          console.log(`[CreatureVisualController] Successfully initialized imported GLTF model for ${this.type}`);
          
          this.playAnimation('idle', true);
          return clonedScene;
        }
      } catch (e) {
        console.warn(`[CreatureVisualController] Failed to load imported model for ${this.type}, using procedural fallback.`, e);
      }
    }
    
    // Fallback or if no imported URL provided
    const proceduralGroup = this.proceduralGenerator(this.type, config);
    this.visual = { group: proceduralGroup };
    this.isUsingImported = false;
    return proceduralGroup;
  }

  public getGroup(): THREE.Group | null {
    return this.visual ? this.visual.group : null;
  }

  public update(delta: number, cameraPosition?: THREE.Vector3) {
    if (this.isUsingImported && this.visual) {
      // Distance-based LOD animation update throttling
      let updateFactor = 1;
      if (cameraPosition && this.visual.group) {
        const dist = this.visual.group.position.distanceTo(cameraPosition);
        if (dist > 80) updateFactor = 3; // Throttle distant animation ticks
        else if (dist > 40) updateFactor = 2;
      }

      if (this.visual.animController) {
        this.visual.animController.update(delta * updateFactor);
      } else if (this.visual.mixer) {
        this.visual.mixer.update(delta * updateFactor);
      }
    }
  }

  public playAnimation(name: string, loop: boolean = true) {
    if (this.isUsingImported && this.visual) {
      if (this.visual.animController) {
        this.visual.animController.playState(name, 0.25, loop);
        return;
      }

      if (this.visual.mixer && this.visual.animations && this.visual.animations.length > 0) {
        if (this.isTransientPlaying && loop && name !== 'death') return;
        if (this.currentActionName === name && !this.isTransientPlaying) return;

        let clip: THREE.AnimationClip | null | undefined = THREE.AnimationClip.findByName(this.visual.animations, name);
        if (!clip) {
          clip = this.visual.animations.find(a => 
            a.name.toLowerCase().includes(name.toLowerCase()) || 
            (name === 'movement' && a.name.toLowerCase().includes('walk')) ||
            (name === 'death' && a.name.toLowerCase().includes('die')) ||
            (name === 'damage' && a.name.toLowerCase().includes('hit'))
          );
        }
        if (!clip && this.visual.animations.length > 0) {
          clip = this.visual.animations[0];
        }

        if (clip) {
          this.visual.mixer.stopAllAction();
          const action = this.visual.mixer.clipAction(clip);
          action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
          action.clampWhenFinished = !loop;
          action.reset().play();

          this.currentActionName = name;

          if (!loop && name !== 'death') {
            this.isTransientPlaying = true;
            const onFinished = (e: THREE.Event & { action?: THREE.AnimationAction }) => {
              if (e.action === action) {
                this.isTransientPlaying = false;
                this.visual?.mixer?.removeEventListener('finished', onFinished as any);
                this.currentActionName = '';
              }
            };
            this.visual.mixer.addEventListener('finished', onFinished as any);
          } else {
            this.isTransientPlaying = false;
          }
        }
      }
    }
  }

  public setPosition(x: number, y: number, z: number) {
    if (this.visual && this.visual.group) {
      this.visual.group.position.set(x, y, z);
    }
  }

  public setRotation(y: number) {
    if (this.visual && this.visual.group) {
      this.visual.group.rotation.y = y;
    }
  }

  public setScale(x: number, y: number, z: number) {
    if (this.visual && this.visual.group) {
      this.visual.group.scale.set(x, y, z);
    }
  }

  public isImported(): boolean {
    return this.isUsingImported;
  }
}
