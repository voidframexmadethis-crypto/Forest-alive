import * as THREE from 'three';

export interface AnimationMap {
  idle?: string;
  walk?: string;
  run?: string;
  attack?: string;
  hit?: string;
  stagger?: string;
  death?: string;
  [key: string]: string | undefined;
}

export class AnimationController {
  private mixer: THREE.AnimationMixer;
  private animations: THREE.AnimationClip[];
  private currentAction: THREE.AnimationAction | null = null;
  private currentActionName: string = '';
  private isTransientPlaying: boolean = false;
  private animationMap: AnimationMap;

  constructor(root: THREE.Object3D, animations: THREE.AnimationClip[], animationMap: AnimationMap = {}) {
    this.mixer = new THREE.AnimationMixer(root);
    this.animations = animations || [];
    this.animationMap = animationMap;
  }

  public update(delta: number) {
    this.mixer.update(delta);
  }

  public playState(stateName: string, crossfadeDuration: number = 0.3, loop: boolean = true) {
    if (this.animations.length === 0) return;

    // Prevent looping animation from interrupting non-looping transient actions (like attack or hit)
    if (this.isTransientPlaying && loop && stateName !== 'death') {
      return;
    }

    if (this.currentActionName === stateName && !this.isTransientPlaying) {
      return;
    }

    // Resolve clip name from mapping or fuzzy match
    const targetClipName = this.animationMap[stateName] || stateName;
    let clip: THREE.AnimationClip | null | undefined = THREE.AnimationClip.findByName(this.animations, targetClipName);

    if (!clip) {
      clip = this.animations.find((a) =>
        a.name.toLowerCase().includes(targetClipName.toLowerCase()) ||
        (stateName === 'walk' && a.name.toLowerCase().includes('walk')) ||
        (stateName === 'run' && a.name.toLowerCase().includes('run')) ||
        (stateName === 'movement' && (a.name.toLowerCase().includes('walk') || a.name.toLowerCase().includes('run'))) ||
        (stateName === 'death' && (a.name.toLowerCase().includes('die') || a.name.toLowerCase().includes('death'))) ||
        (stateName === 'hit' && (a.name.toLowerCase().includes('hit') || a.name.toLowerCase().includes('damage')))
      );
    }

    if (!clip && this.animations.length > 0) {
      clip = this.animations[0];
    }

    if (!clip) return;

    const newAction = this.mixer.clipAction(clip);
    newAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    newAction.clampWhenFinished = !loop;

    if (this.currentAction && this.currentAction !== newAction) {
      this.currentAction.fadeOut(crossfadeDuration);
    }

    newAction.reset().fadeIn(crossfadeDuration).play();

    this.currentAction = newAction;
    this.currentActionName = stateName;

    if (!loop && stateName !== 'death') {
      this.isTransientPlaying = true;
      const onFinished = (e: THREE.Event & { action?: THREE.AnimationAction }) => {
        if (e.action === newAction) {
          this.isTransientPlaying = false;
          this.mixer.removeEventListener('finished', onFinished as any);
          this.currentActionName = '';
        }
      };
      this.mixer.addEventListener('finished', onFinished as any);
    } else {
      this.isTransientPlaying = false;
    }
  }

  public getMixer(): THREE.AnimationMixer {
    return this.mixer;
  }

  public getCurrentState(): string {
    return this.currentActionName;
  }
}
