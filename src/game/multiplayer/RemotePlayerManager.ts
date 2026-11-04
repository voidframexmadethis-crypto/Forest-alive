import * as THREE from 'three';
import { CharacterMeshBuilder, HumanCharacterId } from '../characterMesh';
import { CharacterRigController } from '../characterRig';
import { NetworkPlayer } from '../../types/multiplayer';
import { soundEngine } from '../audio';
import { CHARACTERS_INFO } from '../../components/CharacterSelectModal';

export interface RemotePlayerEntity {
  id: string;
  name: string;
  characterId: HumanCharacterId;
  group: THREE.Group;
  rig: CharacterRigController;
  targetPos: THREE.Vector3;
  targetYaw: number;
  health: number;
  maxHealth: number;
  isDowned: boolean;
  isDead: boolean;
  stance: 'standing' | 'crouching' | 'prone' | 'sliding' | 'sprinting';
  isAiming: boolean;
  nametagMesh: THREE.Sprite;
  currentWeaponId: string;
}

export class RemotePlayerManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private players = new Map<string, RemotePlayerEntity>();
  private localPlayerId: string;

  constructor(scene: THREE.Scene, camera: THREE.Camera, localPlayerId: string) {
    this.scene = scene;
    this.camera = camera;
    this.localPlayerId = localPlayerId;
  }

  public updatePlayer(playerId: string, data: Partial<NetworkPlayer>, defaultName?: string, defaultChar?: HumanCharacterId) {
    if (playerId === this.localPlayerId) return;

    let entity = this.players.get(playerId);

    if (!entity) {
      const charId: HumanCharacterId = data.characterId || defaultChar || 'katrina';
      const parts = CharacterMeshBuilder.createHumanCharacter(charId);
      this.scene.add(parts.group);

      const rig = new CharacterRigController(parts);
      rig.setEquippedWeapon(data.weaponId || 'm4a1');

      const nametag = this.createNametagSprite(data.name || defaultName || 'Teammate', charId);
      parts.group.add(nametag);
      nametag.position.y = 2.3; // Above character head

      entity = {
        id: playerId,
        name: data.name || defaultName || 'Teammate',
        characterId: charId,
        group: parts.group,
        rig,
        targetPos: new THREE.Vector3(data.position?.x ?? 0, data.position?.y ?? 0, data.position?.z ?? 0),
        targetYaw: data.rotation?.yaw ?? 0,
        health: data.health ?? 100,
        maxHealth: data.maxHealth ?? 100,
        isDowned: data.isDowned ?? false,
        isDead: data.isDead ?? false,
        stance: data.stance || 'standing',
        isAiming: data.isAiming ?? false,
        nametagMesh: nametag,
        currentWeaponId: data.weaponId || 'm4a1'
      };

      this.players.set(playerId, entity);
    }

    // Update target vectors
    if (data.position) {
      entity.targetPos.set(data.position.x, data.position.y, data.position.z);
    }
    if (data.rotation) {
      entity.targetYaw = data.rotation.yaw;
    }
    if (data.health !== undefined) {
      entity.health = data.health;
    }
    if (data.isDowned !== undefined) {
      entity.isDowned = data.isDowned;
    }
    if (data.isDead !== undefined) {
      entity.isDead = data.isDead;
    }
    if (data.stance) {
      entity.stance = data.stance;
    }
    if (data.isAiming !== undefined) {
      entity.isAiming = data.isAiming;
    }
    if (data.weaponId && data.weaponId !== entity.currentWeaponId) {
      entity.currentWeaponId = data.weaponId;
      entity.rig.setEquippedWeapon(data.weaponId);
    }

    // Stance & animation adjustments
    if (entity.isDowned) {
      entity.group.position.y = -0.4; // Fallen to knees
      entity.rig.setState('crouch');
    } else if (entity.stance === 'sprinting') {
      entity.group.position.y = 0;
      entity.rig.setState('sprint');
    } else if (entity.stance === 'crouching' || entity.stance === 'sliding') {
      entity.group.position.y = -0.3;
      entity.rig.setState('crouch');
    } else {
      entity.group.position.y = 0;
      entity.rig.setState('idle');
    }
  }

  public removePlayer(playerId: string) {
    const entity = this.players.get(playerId);
    if (entity) {
      this.scene.remove(entity.group);
      this.players.delete(playerId);
    }
  }

  public handleBulletFired(playerId: string, origin: { x: number; y: number; z: number }, direction: { x: number; y: number; z: number }, weaponId: string) {
    const entity = this.players.get(playerId);
    if (!entity) return;

    soundEngine.playGunshot(weaponId);

    // Render tracer line
    const start = new THREE.Vector3(origin.x, origin.y, origin.z);
    const end = start.clone().add(new THREE.Vector3(direction.x, direction.y, direction.z).multiplyScalar(50));

    const lineGeo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffea75, linewidth: 2, transparent: true, opacity: 0.9 });
    const tracer = new THREE.Line(lineGeo, lineMat);
    this.scene.add(tracer);

    setTimeout(() => {
      this.scene.remove(tracer);
      lineGeo.dispose();
      lineMat.dispose();
    }, 60);
  }

  public tick(delta: number) {
    this.players.forEach((entity) => {
      // Smooth position interpolation
      const prevPos = entity.group.position.clone();
      entity.group.position.lerp(entity.targetPos, Math.min(1.0, delta * 15.0));
      const movedDist = entity.group.position.distanceTo(prevPos);
      const moveSpeed = delta > 0 ? movedDist / delta : 0;

      // Smooth rotation interpolation
      entity.group.rotation.y = THREE.MathUtils.lerp(entity.group.rotation.y, entity.targetYaw, Math.min(1.0, delta * 15.0));

      // Update 3D Character Rig animation
      const isSprinting = entity.stance === 'sprinting';
      entity.rig.update(delta, moveSpeed, 0, undefined, entity.isAiming, isSprinting);

      // Update nametag canvas if health changed
      this.updateNametagTexture(entity);
    });
  }

  public getDownedTeammateInRange(playerPos: THREE.Vector3, maxDistance: number = 3.0): RemotePlayerEntity | null {
    for (const entity of this.players.values()) {
      if (entity.isDowned && !entity.isDead) {
        const dist = entity.group.position.distanceTo(playerPos);
        if (dist <= maxDistance) {
          return entity;
        }
      }
    }
    return null;
  }

  private createNametagSprite(name: string, characterId: HumanCharacterId): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.drawNametag(ctx, name, characterId, 100, 100, false);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.6, 0.5, 1.0);
    return sprite;
  }

  private updateNametagTexture(entity: RemotePlayerEntity) {
    const sprite = entity.nametagMesh;
    const canvas = (sprite.material.map as THREE.CanvasTexture).image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.drawNametag(ctx, entity.name, entity.characterId, entity.health, entity.maxHealth, entity.isDowned);
      sprite.material.map!.needsUpdate = true;
    }
  }

  private drawNametag(ctx: CanvasRenderingContext2D, name: string, characterId: HumanCharacterId, health: number, maxHealth: number, isDowned: boolean) {
    const charName = CHARACTERS_INFO[characterId]?.name.split(' ')[0] || characterId.toUpperCase();

    // Background pill
    ctx.fillStyle = isDowned ? 'rgba(180, 0, 0, 0.85)' : 'rgba(10, 10, 15, 0.8)';
    ctx.strokeStyle = isDowned ? '#ef4444' : '#525252';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(8, 8, 240, 64, 12);
    ctx.fill();
    ctx.stroke();

    // Text Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${name} (${charName})`, 128, 32);

    if (isDowned) {
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('⚠️ HOLD [E] TO REVIVE', 128, 56);
    } else {
      // Mini Health Bar
      const pct = Math.max(0, Math.min(1.0, health / maxHealth));
      ctx.fillStyle = '#262626';
      ctx.fillRect(24, 44, 208, 12);
      ctx.fillStyle = pct > 0.4 ? '#22c55e' : '#ef4444';
      ctx.fillRect(24, 44, 208 * pct, 12);
    }
  }

  public getPlayerCount(): number {
    return this.players.size;
  }

  public dispose() {
    this.players.forEach((entity) => {
      this.scene.remove(entity.group);
    });
    this.players.clear();
  }
}
