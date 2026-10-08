import * as THREE from 'three';
import { Creature, CreatureType, ForestType, GameMode, PlayerStats, Weapon, WeaponType } from '../types/game';
import { CREATURE_CONFIGS } from './creatures';
import { WEAPONS_DATABASE } from './weapons';
import { soundEngine } from './audio';
import { AssetManager } from './assets/AssetManager';
import { CreatureVisualController } from './visuals/CreatureVisualController';
import { CharacterMeshBuilder, HumanCharacterId } from './characterMesh';
import { CharacterRigController } from './characterRig';
import { FirstPersonRigController } from './firstPersonRig';
import { ForestEnvironmentManager } from './forestEnvironment';
import { EncounterDirector } from './controllers/EncounterDirector';

export interface EngineCallbacks {
  onStatsChange: (stats: PlayerStats) => void;
  onWeaponChange: (weapon: Weapon) => void;
  onGameEvent: (event: string) => void;
  onGameOver: (victory: boolean) => void;
  onEnterSafehouseRest: () => void;
}

export class GameEngine {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  // Lights & Flashlight
  private ambientLight: THREE.AmbientLight;
  private moonLight: THREE.DirectionalLight;
  private flashlight: THREE.SpotLight;

  // Player state
  public isLocked: boolean = false;
  private moveForward: boolean = false;
  private moveBackward: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private canJump: boolean = false;

  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private playerPos = new THREE.Vector3(0, 1.7, 0);
  private pitch: number = 0;
  private yaw: number = 0;
  private cameraRoll: number = 0;

  // Touch look controls
  private lastTouchX: number | null = null;
  private lastTouchY: number | null = null;

  // Stance states
  public isCrouched: boolean = false;
  public isProne: boolean = false;
  public isSliding: boolean = false;
  public isDolphinDiving: boolean = false;

  // Stance height interpolation (Walking: 1.7, Crouching: 0.9, Sliding: 0.9, Prone: 0.4)
  private eyeHeight: number = 1.7;
  private targetEyeHeight: number = 1.7;

  // Head bobbing timer & amplitude
  private bobTime: number = 0;

  // Sliding & Dolphin Diving
  private slideTimer: number = 0;
  private slideDuration: number = 0.7; // standard sliding seconds
  private slideDirection = new THREE.Vector3();
  
  private diveTimer: number = 0;
  private diveDuration: number = 0.8; // dolphin dive seconds
  private diveDirection = new THREE.Vector3();

  // Weapon sway & ADS alignment
  private mouseSwayX: number = 0;
  private mouseSwayY: number = 0;
  private adsInterpolation: number = 0; // 0 (hip) to 1 (full ADS)

  // Procedural weapon recoil & spring kickback
  private weaponRecoilOffset = new THREE.Vector3();
  private weaponRecoilRot = new THREE.Vector3();

  // Procedural camera shake
  private camShake = new THREE.Vector3();
  private camShakeRot = new THREE.Vector3();

  // Hitmarker timing
  private hitMarkerTimer: number = 0;

  public stats: PlayerStats = {
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    isSprinting: false,
    isBreathingHeavy: false,
    isFlashlightOn: false,
    bloodOnScreen: 0,
    greenAcidOnScreen: 0,
    whiteMistOnScreen: 0,
    kills: 0,
    headshots: 0,
    survivalSeconds: 0,
    inTank: false,
    coughedBlood: false,
    isCrouched: false,
    isProne: false,
    isSliding: false,
    isHitmarkerActive: false,
    skinwalkerJumpScareActive: false,
    unlockedWeapons: 'm4a1,smoke_grenade,shotgun,sniper,minigun,grenade'
  };

  public currentWeapon: Weapon = { ...WEAPONS_DATABASE.m4a1 };
  public availableWeapons: Weapon[] = [
    { ...WEAPONS_DATABASE.m4a1 },
    { ...WEAPONS_DATABASE.smoke_grenade },
    { ...WEAPONS_DATABASE.shotgun },
    { ...WEAPONS_DATABASE.sniper },
    { ...WEAPONS_DATABASE.minigun },
    { ...WEAPONS_DATABASE.grenade }
  ];
  public weaponIndex: number = 0;

  private thrownGrenades: {
    mesh: THREE.Group;
    velocity: THREE.Vector3;
    type: 'smoke_grenade' | 'grenade';
    fuseTimer: number;
    exploded: boolean;
  }[] = [];

  private activeSmokeClouds: {
    mesh: THREE.Group;
    particles: THREE.Points;
    position: THREE.Vector3;
    radius: number;
    duration: number;
    maxDuration: number;
  }[] = [];

  public isAiming: boolean = false;
  public isReloading: boolean = false;
  public lastFireTime: number = 0;

  // World & Entities
  public creatures: Creature[] = [];
  private gunDrops: { type: WeaponType; position: THREE.Vector3; mesh: THREE.Group }[] = [];
  public tankMesh: THREE.Group | null = null;
  public tankPos = new THREE.Vector3(0, 0, -25);
  public jeepMesh: THREE.Group | null = null;
  public jeepPos = new THREE.Vector3(15, 0, -10);
  public airplaneMesh: THREE.Group | null = null;
  public airplanePos = new THREE.Vector3(-28, 0, -15);
  public macSuitMesh: THREE.Group | null = null;
  public macSuitPos = new THREE.Vector3(25, 0, 15);
  public safehouseMesh: THREE.Group | null = null;
  public safehousePos = new THREE.Vector3(0, 0, 45);

  // Particles & Effects
  private particleGroup = new THREE.Group();
  private muzzleFlashLight: THREE.PointLight;
  private weaponMeshGroup: THREE.Group;
  private recoilPitch: number = 0;

  // Game setup
  public mode: GameMode = 'blood_harvest';
  public forestType: ForestType = 'pine_dark';
  private callbacks: EngineCallbacks;
  private animationFrameId: number | null = null;
  private lastTime: number = performance.now();
  private survivalTimerInterval: number | null = null;

  // Telescopic & Vehicle modes
  public isTelescopeMode: boolean = false;
  public isTankMode: boolean = false;
  public isJeepMode: boolean = false;
  public isAirplaneMode: boolean = false;
  public isMacSuitMode: boolean = false;
  private skinwalkerJumpScareCooldown: number = 0;

  // Realism Rigs & Forest Environment
  public forestEnv!: ForestEnvironmentManager;
  public firstPersonRig!: FirstPersonRigController;
  public encounterDirector!: EncounterDirector;
  public playerAvatarId: HumanCharacterId = 'titan';
  private playerCharacterRig!: CharacterRigController;
  private storyNpcs: { id: HumanCharacterId; name: string; rig: CharacterRigController }[] = [];
  private nextFootstepTime: number = 0;

  // Dynamic FPS Movement/Look Physics config matching standard engine scripts
  public config = {
    mouseSensitivity: 0.0022,
    baseSpeed: 6.0,
    sprintMultiplier: 1.7,
    accelerationDamping: 10.0,
    decelerationDamping: 10.0,
    gravity: 24.5, // 9.8 * 2.5
    jumpForce: 7.5,
    bobFrequency: 8.0,
    bobAmplitudeX: 0.03,
    bobAmplitudeY: 0.05,
    sprintBobMultiplier: 1.625,
    crouchSpeed: 2.8,
    proneSpeed: 1.5,
    cameraRollWeight: 0.008
  };

  public updateConfig(newConfig: Partial<typeof this.config>) {
    this.config = { ...this.config, ...newConfig };
  }

  constructor(container: HTMLDivElement, mode: GameMode, forestType: ForestType, callbacks: EngineCallbacks) {
    this.container = container;
    this.mode = mode;
    this.forestType = forestType;
    this.callbacks = callbacks;

    if (this.mode === 'the_fast_guy') {
      this.stats.unlockedWeapons = 'fast_guy,m4a1,smoke_grenade,shotgun,sniper,minigun,grenade';
      this.availableWeapons = [
        { ...WEAPONS_DATABASE.fast_guy },
        { ...WEAPONS_DATABASE.m4a1 },
        { ...WEAPONS_DATABASE.smoke_grenade },
        { ...WEAPONS_DATABASE.shotgun },
        { ...WEAPONS_DATABASE.sniper },
        { ...WEAPONS_DATABASE.minigun },
        { ...WEAPONS_DATABASE.grenade }
      ];
      this.currentWeapon = { ...WEAPONS_DATABASE.fast_guy };
    }

    // Director
    this.encounterDirector = new EncounterDirector(this.mode);

    // 1. Scene & Camera setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
    this.camera.position.copy(this.playerPos);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 3. Lighting & Fog
    this.ambientLight = new THREE.AmbientLight(0x1a2436, 0.4);
    this.scene.add(this.ambientLight);

    this.moonLight = new THREE.DirectionalLight(0x5a7ca8, 0.8);
    this.moonLight.position.set(40, 80, -20);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 1024;
    this.moonLight.shadow.mapSize.height = 1024;
    this.scene.add(this.moonLight);

    this.setupFog();

    // 4. Flashlight
    this.flashlight = new THREE.SpotLight(0xfffae6, 3.5, 30, Math.PI / 6, 0.4, 1.2);
    this.flashlight.castShadow = true;
    this.scene.add(this.flashlight);
    this.scene.add(this.flashlight.target);

    // Muzzle flash light
    this.muzzleFlashLight = new THREE.PointLight(0xffaa22, 0, 10);
    this.scene.add(this.muzzleFlashLight);

    // 5. First-Person Hands/Arms Rig & Weapon 3D View model
    this.firstPersonRig = new FirstPersonRigController(this.camera);
    this.weaponMeshGroup = this.firstPersonRig.weaponSocket;
    this.scene.add(this.camera);
    this.updateWeaponMesh();

    // 6. Forest Environment & World Geometry
    this.forestEnv = new ForestEnvironmentManager(this.scene, this.forestType);
    this.scene.add(this.particleGroup);
    this.buildTerrain();
    this.buildForest();
    if (this.mode === 'death_toll') {
      this.buildDeathTollLevel();
    }
    this.buildTank();
    this.buildJeep();
    this.buildAirplane();
    this.buildMacSuit();
    this.buildSafehouse();

    // 7. Human Characters & Single-Player Rules (Player = Titan; Katrina, Lewis, Bill = Story NPCs)
    this.playerAvatarId = 'titan';
    const playerParts = CharacterMeshBuilder.createHumanCharacter(this.playerAvatarId);
    this.playerCharacterRig = new CharacterRigController(playerParts);
    this.spawnStoryNpcs();

    // 8. Event listeners & Loop
    this.setupEventListeners();
    this.spawnInitialCreatures();

    this.startSurvivalTimer();
    this.animate();
  }

  private spawnStoryNpcs() {
    this.storyNpcs.forEach((n) => this.scene.remove(n.rig.getRootGroup()));
    this.storyNpcs = [];

    const npcConfigs: { id: HumanCharacterId; name: string; pos: THREE.Vector3; weaponId: string }[] = [
      { id: 'katrina', name: 'Katrina', pos: new THREE.Vector3(-2.8, 0, 43.5), weaponId: 'shotgun' },
      { id: 'lewis', name: 'Lewis', pos: new THREE.Vector3(2.8, 0, 42.5), weaponId: 'ak47' },
      { id: 'bill', name: 'Bill', pos: new THREE.Vector3(0, 0, 46.5), weaponId: 'sniper' }
    ];

    npcConfigs.forEach((npc) => {
      const parts = CharacterMeshBuilder.createHumanCharacter(npc.id);
      parts.group.position.copy(npc.pos);
      parts.group.rotation.y = Math.PI;
      this.scene.add(parts.group);

      const rig = new CharacterRigController(parts);
      rig.setEquippedWeapon(npc.weaponId);
      this.storyNpcs.push({ id: npc.id, name: npc.name, rig });
    });
  }

  public setPlayerAvatar(avatarId: HumanCharacterId) {
    this.playerAvatarId = avatarId;
    this.callbacks.onGameEvent(`Selected Multiplayer Avatar: ${avatarId.toUpperCase()}`);
  }

  private setupFog() {
    if (this.forestType === 'pine_dark') {
      this.scene.background = new THREE.Color(0x040810);
      this.scene.fog = new THREE.FogExp2(0x040810, 0.025);
    } else if (this.forestType === 'red_mist') {
      this.scene.background = new THREE.Color(0x180404);
      this.scene.fog = new THREE.FogExp2(0x180404, 0.035);
    } else {
      // dead winter
      this.scene.background = new THREE.Color(0x0a1018);
      this.scene.fog = new THREE.FogExp2(0x0a1018, 0.028);
    }
  }

  private buildTerrain() {
    const geo = new THREE.PlaneGeometry(350, 350, 64, 64);
    geo.rotateX(-Math.PI / 2);

    let matColor = 0x182414;
    if (this.forestType === 'red_mist') matColor = 0x221212;
    if (this.forestType === 'dead_winter') matColor = 0x222a33;

    const mat = new THREE.MeshStandardMaterial({
      color: matColor,
      roughness: 0.9,
      metalness: 0.1
    });

    const terrain = new THREE.Mesh(geo, mat);
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    // Concrete Pathway (gray corridor spanning the combat arena)
    const pathGeo = new THREE.PlaneGeometry(5, 95);
    pathGeo.rotateX(-Math.PI / 2);
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x42464c,
      roughness: 0.8,
      metalness: 0.2
    });
    const pathway = new THREE.Mesh(pathGeo, pathMat);
    pathway.position.set(0, 0.015, 10); // raised to avoid z-fighting
    pathway.receiveShadow = true;
    this.scene.add(pathway);
  }

  private buildForest() {
    const treeGroup = new THREE.Group();
    const count = 140;

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 280;
      const z = (Math.random() - 0.5) * 280;

      // Don't spawn trees right on top of player start or safehouse
      if (Math.hypot(x, z) < 12 || Math.hypot(x - this.safehousePos.x, z - this.safehousePos.z) < 18) continue;

      const height = 10 + Math.random() * 8;
      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.6, height, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2c1d11, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x, height / 2, z);
      trunk.castShadow = true;

      // Foliage / bare branches
      if (this.forestType !== 'dead_winter') {
        const foliageGeo = new THREE.ConeGeometry(3.5, 8, 8);
        const foliageMat = new THREE.MeshStandardMaterial({
          color: this.forestType === 'red_mist' ? 0x4a1212 : 0x0f2e13,
          roughness: 0.8
        });
        const foliage = new THREE.Mesh(foliageGeo, foliageMat);
        foliage.position.set(x, height + 2, z);
        foliage.castShadow = true;
        treeGroup.add(foliage);
      } else {
        // Winter bare tree tops
        const foliageGeo = new THREE.DodecahedronGeometry(2);
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x3a4856, roughness: 0.8, wireframe: true });
        const foliage = new THREE.Mesh(foliageGeo, foliageMat);
        foliage.position.set(x, height + 1, z);
        treeGroup.add(foliage);
      }

      treeGroup.add(trunk);
    }
    this.scene.add(treeGroup);
  }

  private buildDeathTollLevel() {
    const deathTollGroup = new THREE.Group();
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x3a241b, roughness: 0.6, metalness: 0.8 });
    const containerMat = new THREE.MeshStandardMaterial({ color: 0x1f3448, roughness: 0.7, metalness: 0.5 });
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.8, metalness: 0.9 });

    // 1. Industrial Railway Tracks
    for (let t = -2; t <= 2; t++) {
      const railL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 180), trackMat);
      railL.position.set(t * 12 - 0.8, 0.08, 0);
      const railR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 180), trackMat);
      railR.position.set(t * 12 + 0.8, 0.08, 0);
      deathTollGroup.add(railL, railR);
    }

    // 2. 3D Freight Boxcars on Railway Tracks
    const boxcarPositions = [
      { x: -12, z: 20 }, { x: -12, z: -15 },
      { x: 12, z: 35 }, { x: 12, z: -30 },
      { x: -24, z: 0 }, { x: 24, z: 10 }
    ];
    boxcarPositions.forEach((p) => {
      const boxcar = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.6, 12), steelMat);
      body.position.y = 2.4;
      body.castShadow = true;
      body.receiveShadow = true;

      for (let w = -1; w <= 1; w += 2) {
        const wheelL = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 12), trackMat);
        wheelL.rotation.z = Math.PI / 2;
        wheelL.position.set(-1.4, 0.4, w * 4);

        const wheelR = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 12), trackMat);
        wheelR.rotation.z = Math.PI / 2;
        wheelR.position.set(1.4, 0.4, w * 4);

        boxcar.add(wheelL, wheelR);
      }
      boxcar.add(body);
      boxcar.position.set(p.x, 0, p.z);
      deathTollGroup.add(boxcar);
    });

    // 3. Rusted Shipping Containers
    const containerPositions = [
      { x: -8, z: -5, rot: 0.3 },
      { x: 18, z: -12, rot: -0.5 },
      { x: -18, z: 30, rot: 1.2 },
      { x: 8, z: 45, rot: -0.8 }
    ];
    containerPositions.forEach((c) => {
      const container = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 6.5), containerMat);
      container.position.set(c.x, 1.4, c.z);
      container.rotation.y = c.rot;
      container.castShadow = true;
      deathTollGroup.add(container);
    });

    // 4. Halogen Floodlight Towers
    const floodlightPositions = [
      { x: -15, z: 15 }, { x: 15, z: -15 }, { x: -15, z: -35 }, { x: 15, z: 35 }
    ];
    floodlightPositions.forEach((f) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 9, 8), trackMat);
      pole.position.set(f.x, 4.5, f.z);

      const lamp = new THREE.PointLight(0xaad4ff, 2.2, 22);
      lamp.position.set(f.x, 8.8, f.z);

      const lampMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.8), new THREE.MeshBasicMaterial({ color: 0xaad4ff }));
      lampMesh.position.set(f.x, 8.8, f.z);

      deathTollGroup.add(pole, lamp, lampMesh);
    });

    this.scene.add(deathTollGroup);
  }

  private buildTank() {
    const tank = new THREE.Group();

    // Main hull
    const hullGeo = new THREE.BoxGeometry(4.2, 1.8, 7.5);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x2a3328, roughness: 0.6, metalness: 0.7 });
    const hull = new THREE.Mesh(hullGeo, tankMat);
    hull.position.y = 1.2;
    hull.castShadow = true;
    tank.add(hull);

    // Treads
    const treadGeo = new THREE.BoxGeometry(0.8, 1.2, 7.8);
    const treadMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const leftTread = new THREE.Mesh(treadGeo, treadMat);
    leftTread.position.set(-2.2, 0.6, 0);
    const rightTread = new THREE.Mesh(treadGeo, treadMat);
    rightTread.position.set(2.2, 0.6, 0);
    tank.add(leftTread, rightTread);

    // Turret dome
    const turretGeo = new THREE.CylinderGeometry(1.8, 2.0, 1.2, 12);
    const turret = new THREE.Mesh(turretGeo, tankMat);
    turret.position.set(0, 2.5, -0.5);
    turret.castShadow = true;
    tank.add(turret);

    // Main 120mm barrel
    const barrelGeo = new THREE.CylinderGeometry(0.2, 0.25, 4.5, 12);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, tankMat);
    barrel.position.set(0, 2.6, 2.5);
    barrel.castShadow = true;
    tank.add(barrel);

    // Tank Headlights
    const headlightLeft = new THREE.SpotLight(0xffeaad, 4, 25, Math.PI / 5, 0.3);
    headlightLeft.position.set(-1.6, 1.8, 3.8);
    headlightLeft.target.position.set(-1.6, 0, 15);
    tank.add(headlightLeft, headlightLeft.target);

    const headlightRight = new THREE.SpotLight(0xffeaad, 4, 25, Math.PI / 5, 0.3);
    headlightRight.position.set(1.6, 1.8, 3.8);
    headlightRight.target.position.set(1.6, 0, 15);
    tank.add(headlightRight, headlightRight.target);

    tank.position.copy(this.tankPos);
    this.tankMesh = tank;
    this.scene.add(tank);
  }

  private buildJeep() {
    // Indestructible 4x4 Survival Jeep with Front Hood Mounted Heavy Cannon
    const jeep = new THREE.Group();
    const jeepMat = new THREE.MeshStandardMaterial({ color: 0x2b3e23, roughness: 0.5, metalness: 0.6 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5 });

    // Chassis Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 4.5), jeepMat);
    body.position.y = 0.9;
    jeep.add(body);

    // Windshield frame & glass
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 0.1), glassMat);
    windshield.position.set(0, 1.7, 0.5);
    jeep.add(windshield);

    // Roll cage
    const cage = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.0, 2.2), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    cage.position.set(0, 1.8, -0.6);
    jeep.add(cage);

    // 4 Heavy Off-road Wheels
    const wheelPositions = [
      { x: -1.3, z: 1.4 }, { x: 1.3, z: 1.4 },
      { x: -1.3, z: -1.4 }, { x: 1.3, z: -1.4 }
    ];
    wheelPositions.forEach((wp) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wp.x, 0.5, wp.z);
      jeep.add(wheel);
    });

    // Front Hood Mounted Cannon
    const cannonBar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4), new THREE.MeshStandardMaterial({ color: 0x0f0f12, metalness: 0.9 }));
    cannonBar.rotation.x = Math.PI / 2;
    cannonBar.position.set(0, 1.6, 2.0);
    jeep.add(cannonBar);

    jeep.position.copy(this.jeepPos);
    this.jeepMesh = jeep;
    this.scene.add(jeep);
  }

  private buildAirplane() {
    // Usable Survival Recon Airplane
    const plane = new THREE.Group();
    const planeMat = new THREE.MeshStandardMaterial({ color: 0x3a4856, roughness: 0.4, metalness: 0.7 });
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xc8d6e5, roughness: 0.5 });

    // Fuselage
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.4, 7.0, 12), planeMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = 1.2;
    plane.add(body);

    // Main Wingspan
    const wings = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.1, 1.6), wingMat);
    wings.position.set(0, 1.5, 0.5);
    plane.add(wings);

    // Tail Fin
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 1.2), planeMat);
    tail.position.set(0, 2.2, -3.0);
    plane.add(tail);

    // Spinning Nose Propeller
    const prop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 0.05), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    prop.position.set(0, 1.2, 3.55);
    plane.add(prop);

    plane.position.copy(this.airplanePos);
    this.airplaneMesh = plane;
    this.scene.add(plane);
  }

  private buildMacSuit() {
    // Heavy Combat MAC SUIT Mech Prototype
    const suit = new THREE.Group();
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x222a30, metalness: 0.85, roughness: 0.25 });
    const goldCoreMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    // Torso / Cockpit
    const torso = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.2, 1.6), armorMat);
    torso.position.y = 2.8;

    // Golden Core Eye
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.3), goldCoreMat);
    core.position.set(0, 3.1, 0.85);

    // Leg Struts
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 2.2), armorMat);
    legL.position.set(-1.1, 1.1, 0);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 2.2), armorMat);
    legR.position.set(1.1, 1.1, 0);

    // Heavy Shoulder RPG Pod
    const rpgPod = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.2), armorMat);
    rpgPod.position.set(-1.4, 3.8, 0);

    // Pneumatic IRON FIST Cannon Arm
    const ironFistArm = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 1.8), armorMat);
    ironFistArm.rotation.x = Math.PI / 2;
    ironFistArm.position.set(1.5, 2.6, 0.8);

    suit.add(torso, core, legL, legR, rpgPod, ironFistArm);
    suit.position.copy(this.macSuitPos);
    this.macSuitMesh = suit;
    this.scene.add(suit);
  }

  private buildSafehouse() {
    const safehouse = new THREE.Group();

    // Exterior Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3d322b, roughness: 0.8 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1f1915, roughness: 0.9 });

    // Main building box
    const houseBox = new THREE.Mesh(new THREE.BoxGeometry(14, 5, 12), wallMat);
    houseBox.position.set(0, 2.5, 0);
    houseBox.castShadow = true;
    houseBox.receiveShadow = true;
    safehouse.add(houseBox);

    // Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(11, 4, 4), roofMat);
    roof.position.set(0, 7, 0);
    roof.rotation.y = Math.PI / 4;
    safehouse.add(roof);

    // Doorway
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(2, 3.8, 0.3), doorFrameMat);
    door.position.set(0, 1.9, 6.01);
    safehouse.add(door);

    // Fortified Window (Telescope Slot)
    const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x0f0d0b }));
    windowFrame.position.set(3.5, 2.8, 6.01);
    safehouse.add(windowFrame);

    // Warm Interior Light
    const intLight = new THREE.PointLight(0xffaa44, 2.5, 15);
    intLight.position.set(0, 3.5, 0);
    safehouse.add(intLight);

    safehouse.position.copy(this.safehousePos);
    this.safehouseMesh = safehouse;
    this.scene.add(safehouse);
  }

  private updateWeaponMesh() {
    // Clear old gun mesh
    while (this.weaponMeshGroup.children.length > 0) {
      this.weaponMeshGroup.remove(this.weaponMeshGroup.children[0]);
    }

    const gunMat = new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.4, metalness: 0.8 });
    const gunGroup = new THREE.Group();

    if (this.currentWeapon.id === 'm4a1') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.5), gunMat);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4), gunMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -0.4);

      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.08), gunMat);
      mag.position.set(0, -0.12, -0.1);
      mag.rotation.x = -0.2;

      // Red Dot Scope
      const sight = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08), new THREE.MeshStandardMaterial({ color: 0x222222 }));
      sight.rotation.x = Math.PI / 2;
      sight.position.set(0, 0.08, -0.1);

      gunGroup.add(body, barrel, mag, sight);
      gunGroup.position.set(0.22, -0.2, -0.45);
    } else if (this.currentWeapon.id === 'ak47') {
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.5, metalness: 0.85 });
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3311, roughness: 0.8, metalness: 0.1 });

      // Steel receiver (body)
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.48), steelMat);
      
      // Wooden handguard
      const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.22), woodMat);
      handguard.position.set(0, -0.01, -0.2);

      // Steel barrel
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.42), steelMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -0.42);

      // Curved steel magazine
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.09), steelMat);
      mag.position.set(0, -0.15, -0.1);
      mag.rotation.x = -0.35; // distinct curved AK magazine sweep

      // Wooden stock
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.13, 0.32), woodMat);
      stock.position.set(0, -0.04, 0.32);

      gunGroup.add(body, handguard, barrel, mag, stock);
      gunGroup.position.set(0.22, -0.2, -0.45);
    } else if (this.currentWeapon.id === 'shotgun') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.65), gunMat);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55), gunMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.03, -0.45);

      const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22), new THREE.MeshStandardMaterial({ color: 0x3e2a1e }));
      pump.rotation.x = Math.PI / 2;
      pump.position.set(0, 0.01, -0.35);

      gunGroup.add(body, barrel, pump);
      gunGroup.position.set(0.24, -0.22, -0.48);
    } else if (this.currentWeapon.id === 'sniper') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.8), gunMat);
      const longBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.75), gunMat);
      longBarrel.rotation.x = Math.PI / 2;
      longBarrel.position.set(0, 0.03, -0.65);

      // Large Telescope Scope
      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.28), new THREE.MeshStandardMaterial({ color: 0x0a0a0d }));
      scope.rotation.x = Math.PI / 2;
      scope.position.set(0, 0.11, -0.2);

      gunGroup.add(body, longBarrel, scope);
      gunGroup.position.set(0.25, -0.22, -0.5);
    } else if (this.currentWeapon.id === 'smoke_grenade') {
      // Green Canister
      const canisterMat = new THREE.MeshStandardMaterial({ color: 0x2e6f40, roughness: 0.5 });
      const yellowMat = new THREE.MeshStandardMaterial({ color: 0xcca010, roughness: 0.3 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12), canisterMat);
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.04, 12), yellowMat);
      ring.position.y = 0.06;
      const pin = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.005, 6, 12), yellowMat);
      pin.position.set(0.04, 0.1, 0);

      gunGroup.add(body, ring, pin);
      gunGroup.position.set(0.2, -0.15, -0.35);
    } else if (this.currentWeapon.id === 'grenade') {
      // Frag Grenade
      const fragMat = new THREE.MeshStandardMaterial({ color: 0x3b4a28, roughness: 0.7 });
      const pinMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), fragMat);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.06), pinMat);
      top.position.y = 0.1;

      gunGroup.add(body, top);
      gunGroup.position.set(0.2, -0.15, -0.35);
    } else if (this.currentWeapon.id === 'dragon_gun') {
      // DRAGON GUN: Two-handed weapon with left & right handles, spinning drum, and lightning core
      const dragonMat = new THREE.MeshStandardMaterial({ color: 0x1f1915, roughness: 0.3, metalness: 0.9 });
      const electricMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
      const goldGripMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4 });

      // Main frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.65), dragonMat);

      // Spinning Drum Cylinder in center
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.28, 16), dragonMat);
      drum.rotation.z = Math.PI / 2;
      drum.position.set(0, 0, -0.05);

      // Lightning energy ring around drum
      const elecRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.02, 8, 20), electricMat);
      elecRing.rotation.y = Math.PI / 2;
      elecRing.position.set(0, 0, -0.05);

      // Left & Right Dual Handles
      const leftHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22), goldGripMat);
      leftHandle.position.set(-0.18, -0.08, 0.1);
      leftHandle.rotation.z = 0.3;

      const rightHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22), goldGripMat);
      rightHandle.position.set(0.18, -0.08, 0.1);
      rightHandle.rotation.z = -0.3;

      // Heavy Twin Barrels
      const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5), dragonMat);
      b1.rotation.x = Math.PI / 2;
      b1.position.set(-0.06, 0.04, -0.5);

      const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5), dragonMat);
      b2.rotation.x = Math.PI / 2;
      b2.position.set(0.06, 0.04, -0.5);

      gunGroup.add(frame, drum, elecRing, leftHandle, rightHandle, b1, b2);
      gunGroup.position.set(0, -0.18, -0.42);
    } else if (this.currentWeapon.id === 'whip') {
      // WHIP WEAPON: Control whip cable + firearm nozzle
      const whipHandleMat = new THREE.MeshStandardMaterial({ color: 0x4a2c11, roughness: 0.7 });
      const cableMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
      const nozzleMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.2 });

      // Handle & Firearm Trigger
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.25), whipHandleMat);
      handle.position.set(0, -0.1, 0);

      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.2), nozzleMat);
      nozzle.rotation.x = Math.PI / 2;
      nozzle.position.set(0, 0.02, -0.15);

      // Coiled Whip Cable
      const cableGroup = new THREE.Group();
      for (let c = 0; c < 8; c++) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.012 - c * 0.001, 0.01, 0.15), cableMat);
        seg.rotation.x = Math.PI / 2 + Math.sin(c * 0.8) * 0.2;
        seg.position.set(Math.sin(c * 0.4) * 0.03, -0.02 * c, -0.2 - c * 0.12);
        cableGroup.add(seg);
      }

      gunGroup.add(handle, nozzle, cableGroup);
      gunGroup.position.set(0.22, -0.2, -0.4);
    } else if (this.currentWeapon.id === 'underground_gun') {
      // UNDERGROUND GUN: Subterranean seismic driller with glowing acoustic core
      const drillMat = new THREE.MeshStandardMaterial({ color: 0x22262a, metalness: 0.8, roughness: 0.3 });
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.55), drillMat);
      
      // Acoustic power core
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.06), coreMat);
      core.position.set(0, 0.02, -0.05);

      // Spiral drill cone tip
      const drillTip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.35, 8), drillMat);
      drillTip.rotation.x = Math.PI / 1.8; // pointing slightly down into earth
      drillTip.position.set(0, -0.08, -0.45);

      gunGroup.add(body, core, drillTip);
      gunGroup.position.set(0.24, -0.22, -0.45);
    } else {
      // Minigun
      const barrels = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.6), gunMat);
        b.rotation.x = Math.PI / 2;
        b.position.set(Math.cos(angle) * 0.04, Math.sin(angle) * 0.04, -0.4);
        barrels.add(b);
      }
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4), gunMat);
      body.rotation.x = Math.PI / 2;
      gunGroup.add(body, barrels);
      gunGroup.position.set(0.28, -0.25, -0.45);
    }

    this.weaponMeshGroup.add(gunGroup);
  }

  // --- PROCEDURAL TURTLE MESH FOR ALLERGIC SMOKE TRANSFORMATION ---
  private createTurtleMesh(): THREE.Group {
    const group = new THREE.Group();
    
    // Turtle shell (domed greenish brown shell)
    const shellMat = new THREE.MeshStandardMaterial({ color: 0x3d5a22, roughness: 0.6, metalness: 0.1 });
    const shellPatternMat = new THREE.MeshStandardMaterial({ color: 0x556b2f, roughness: 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x4a7c38, roughness: 0.8 });

    // Main shell dome
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 10), shellMat);
    shell.scale.set(1.0, 0.55, 1.2);
    shell.position.y = 0.45;
    shell.castShadow = true;
    shell.receiveShadow = true;

    // Shell rim border
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.1, 8, 16), shellPatternMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.25;

    // Turtle head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), skinMat);
    head.position.set(0, 0.4, 0.95);

    // Googly eyes
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08), eyeWhiteMat);
    eyeL.position.set(-0.18, 0.48, 1.15);
    const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.04), eyePupilMat);
    pupilL.position.set(-0.18, 0.48, 1.22);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.08), eyeWhiteMat);
    eyeR.position.set(0.18, 0.48, 1.15);
    const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.04), eyePupilMat);
    pupilR.position.set(0.18, 0.48, 1.22);

    // 4 Flipper Legs
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.35, 8), skinMat);
      const xSign = (i % 2 === 0) ? -1 : 1;
      const zSign = (i < 2) ? 1 : -1;
      leg.position.set(xSign * 0.65, 0.18, zSign * 0.5);
      leg.rotation.z = xSign * -0.4;
      group.add(leg);
    }

    // Little tail
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 6), skinMat);
    tail.rotation.x = -Math.PI / 3;
    tail.position.set(0, 0.25, -0.85);

    group.add(shell, rim, head, eyeL, pupilL, eyeR, pupilR, tail);
    group.scale.set(1.3, 1.3, 1.3);
    return group;
  }

  // --- CREATURE SPAWNING LOGIC ---
  private spawnInitialCreatures() {
    this.creatures = [];

    // Spawn based on game mode
    if (this.mode === 'blood_harvest') {
      this.spawnCreaturesOfType('zombie', 6);
      this.spawnCreaturesOfType('striker_zombie', 4);
      this.spawnCreaturesOfType('skinwalker', 2);
      this.spawnCreaturesOfType('double_tank', 1);
      this.spawnCreaturesOfType('crying_witch', 1);
      this.spawnCreaturesOfType('blood_spider', 2);
      this.spawnCreaturesOfType('subterranean_snake', 2);
      this.spawnCreaturesOfType('winged_ice_skinwalker', 1);
      this.spawnCreaturesOfType('stick_skinwalker_18ft', 1);
    } else if (this.mode === 'death_toll') {
      this.spawnCreaturesOfType('zombie', 8);
      this.spawnCreaturesOfType('striker_zombie', 6);
      this.spawnCreaturesOfType('jockey_9tentacles', 2);
      this.spawnCreaturesOfType('double_tank', 1);
      this.spawnCreaturesOfType('cloud_creature', 1);
      this.spawnCreaturesOfType('subterranean_snake', 2);
      this.spawnCreaturesOfType('blood_spider', 2);
      this.spawnCreaturesOfType('stick_skinwalker_18ft', 1);
    } else {
      // CREATURE MODE / THE FAST GUY - ALL ELITE CREATURES
      this.spawnCreaturesOfType('skinwalker', 3);
      this.spawnCreaturesOfType('double_tank', 2);
      this.spawnCreaturesOfType('jockey_9tentacles', 2);
      this.spawnCreaturesOfType('crying_witch', 2);
      this.spawnCreaturesOfType('cloud_creature', 2);
      this.spawnCreaturesOfType('flying_phantom', 3);
      this.spawnCreaturesOfType('blood_spider', 3);
      this.spawnCreaturesOfType('subterranean_snake', 3);
      this.spawnCreaturesOfType('winged_ice_skinwalker', 2);
      this.spawnCreaturesOfType('stick_skinwalker_18ft', 2);
    }
  }

  private async spawnCreaturesOfType(type: CreatureType, count: number) {
    const config = CREATURE_CONFIGS[type];
    const importedUrl = type === 'skinwalker' ? '/assets/models/skinwalker.glb' : undefined;

    for (let i = 0; i < count; i++) {
      const visualController = new CreatureVisualController(type, this.createCreatureMesh.bind(this));
      const instanceMesh = await visualController.initialize(config, importedUrl);

      const angle = Math.random() * Math.PI * 2;
      const distance = 25 + Math.random() * 65;
      const x = this.playerPos.x + Math.sin(angle) * distance;
      const z = this.playerPos.z + Math.cos(angle) * distance;
      const y = (type === 'cloud_creature' || type === 'flying_phantom') ? 7 + Math.random() * 4 : 0;

      instanceMesh.position.set(x, y, z);
      this.scene.add(instanceMesh);

      const initialState = type === 'crying_witch' ? 'idle' : 'chasing';
      visualController.playAnimation(initialState === 'idle' ? 'idle' : 'movement', true);

      const creature: Creature = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        name: config.name,
        position: { x, y, z },
        rotation: 0,
        health: config.maxHealth,
        maxHealth: config.maxHealth,
        speed: config.speed,
        damage: config.damage,
        attackRange: config.attackRange,
        attackCooldown: config.attackCooldown,
        lastAttackTime: 0,
        state: initialState,
        isEnraged: false,
        idleTimer: Math.random() * 1000,
        mesh: instanceMesh,
        visualController
      };

      this.creatures.push(creature);
    }
  }

  private createCreatureMesh(type: CreatureType, config: any): THREE.Group {
    const group = new THREE.Group();
    const eyeMat = new THREE.MeshBasicMaterial({ color: config.eyeColor });

    if (type === 'double_tank') {
      // Enormous musclebound 2-headed tank
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a1212, roughness: 0.6 });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 1.4), bodyMat);
      torso.position.y = 2.0;

      // Two heads
      const head1 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), bodyMat);
      head1.position.set(-0.4, 3.2, 0.1);

      const head2 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), bodyMat);
      head2.position.set(0.4, 3.2, 0.1);

      // Glowing Eyes
      const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.08), eyeMat);
      eye1.position.set(-0.4, 3.25, 0.45);
      const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.08), eyeMat);
      eye2.position.set(0.4, 3.25, 0.45);

      // Massive Arms
      const arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.6), bodyMat);
      arm1.position.set(-1.4, 1.8, 0.3);
      const arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.6), bodyMat);
      arm2.position.set(1.4, 1.8, 0.3);

      group.add(torso, head1, head2, eye1, eye2, arm1, arm2);
    } else if (type === 'skinwalker') {
      // Slender quadruped/biped shape-shifter
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.8 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.8), bodyMat);
      body.position.y = 1.2;

      const head = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 6), bodyMat);
      head.rotation.x = Math.PI / 2;
      head.position.set(0, 1.9, 0.3);

      const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.06), eyeMat);
      eyeLeft.position.set(-0.15, 1.95, 0.55);
      const eyeRight = new THREE.Mesh(new THREE.SphereGeometry(0.06), eyeMat);
      eyeRight.position.set(0.15, 1.95, 0.55);

      group.add(body, head, eyeLeft, eyeRight);
    } else if (type === 'jockey_9tentacles') {
      // Central body + 9 moving tentacles
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f2b18, roughness: 0.5 });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 12), bodyMat);
      body.position.y = 1.1;

      // 9 Tentacles
      for (let i = 0; i < 9; i++) {
        const tAngle = (i / 9) * Math.PI * 2;
        const tentacle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.02, 1.5, 6), bodyMat);
        tentacle.position.set(Math.cos(tAngle) * 0.5, 0.8, Math.sin(tAngle) * 0.5);
        tentacle.rotation.z = Math.PI / 3;
        tentacle.rotation.y = tAngle;
        group.add(tentacle);
      }

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12), eyeMat);
      eye.position.set(0, 1.3, 0.65);
      group.add(body, eye);
    } else if (type === 'crying_witch') {
      // Unnaturally tall (2.4m), slender silhouette, pale horror skin, long arms, knee-length black hair & glowing yellow eyes
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d8, roughness: 0.85 });
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.95 });
      const dressMat = new THREE.MeshStandardMaterial({ color: 0x221f1f, roughness: 0.9 });
      const yellowEyeMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });

      // Slender tall torso
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 1.8, 8), dressMat);
      body.position.y = 0.9;

      // Small pale head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), skinMat);
      head.position.set(0, 1.9, 0.05);

      // Long black hair cascading over head down toward knees
      const hair = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.38, 1.6, 10), hairMat);
      hair.position.set(0, 1.3, -0.05);

      // Yellow glowing eyes that flash in darkness
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.045), yellowEyeMat);
      eyeL.position.set(-0.08, 1.92, 0.22);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.045), yellowEyeMat);
      eyeR.position.set(0.08, 1.92, 0.22);

      // Head point light illuminating yellow eyes in dark rooms
      const eyeGlow = new THREE.PointLight(0xffea00, 1.2, 5);
      eyeGlow.position.set(0, 1.92, 0.3);

      // Unnaturally long arms with sharp claw fingers
      const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 1.5, 8), skinMat);
      armL.position.set(-0.35, 1.1, 0.1);
      armL.rotation.z = 0.2;

      const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 1.5, 8), skinMat);
      armR.position.set(0.35, 1.1, 0.1);
      armR.rotation.z = -0.2;

      group.add(body, head, hair, eyeL, eyeR, eyeGlow, armL, armR);
    } else if (type === 'cloud_creature') {
      // Floating misty orb
      const orbMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, transparent: true, opacity: 0.6, roughness: 0.1 });
      const orb = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), orbMat);

      const core = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), eyeMat);
      group.add(orb, core);
    } else if (type === 'flying_phantom') {
      // Bat wings + gargoyle torso
      const mat = new THREE.MeshStandardMaterial({ color: 0x0f1820, roughness: 0.7 });
      const torso = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 6), mat);

      const wingLeft = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.8), mat);
      wingLeft.position.set(-1.0, 0.2, 0);
      wingLeft.rotation.z = 0.3;

      const wingRight = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.8), mat);
      wingRight.position.set(1.0, 0.2, 0);
      wingRight.rotation.z = -0.3;

      const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.06), eyeMat);
      eye1.position.set(-0.12, 0.4, 0.4);
      const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.06), eyeMat);
      eye2.position.set(0.12, 0.4, 0.4);

      group.add(torso, wingLeft, wingRight, eye1, eye2);
    } else if (type === 'blood_spider') {
      // Giant 8-Legged Blood Spider
      const spiderMat = new THREE.MeshStandardMaterial({ color: 0x110808, roughness: 0.8 });
      const bloodHourglassMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.3 });
      
      // Cephalothorax & Abdomen
      const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10), spiderMat);
      thorax.position.set(0, 0.4, 0);

      const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), spiderMat);
      abdomen.position.set(0, 0.6, -0.9);

      const hourglass = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.05), bloodHourglassMat);
      hourglass.position.set(0, 0.65, -0.1);

      // 8 Jointed Spider Legs
      for (let i = 0; i < 8; i++) {
        const legGroup = new THREE.Group();
        const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.9), spiderMat);
        upperLeg.position.set(0, 0.45, 0);
        upperLeg.rotation.z = 0.8;

        const lowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.015, 0.9), spiderMat);
        lowerLeg.position.set(0.4, -0.1, 0);
        lowerLeg.rotation.z = -1.2;

        legGroup.add(upperLeg, lowerLeg);

        const isLeft = i % 2 === 0;
        const pairIdx = Math.floor(i / 2);
        const zOffset = (pairIdx - 1.5) * 0.35;
        const sideSign = isLeft ? -1 : 1;

        legGroup.position.set(sideSign * 0.4, 0.4, zOffset);
        if (!isLeft) legGroup.rotation.y = Math.PI;

        group.add(legGroup);
      }

      // Fangs & Glowing Eyes
      const fangMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.2 });
      const fang1 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 6), fangMat);
      fang1.rotation.x = Math.PI;
      fang1.position.set(-0.12, 0.25, 0.52);

      const fang2 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 6), fangMat);
      fang2.rotation.x = Math.PI;
      fang2.position.set(0.12, 0.25, 0.52);

      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05), eyeMat);
      eyeL.position.set(-0.15, 0.5, 0.48);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.05), eyeMat);
      eyeR.position.set(0.15, 0.5, 0.48);

      group.add(thorax, abdomen, hourglass, fang1, fang2, eyeL, eyeR);
    } else if (type === 'subterranean_snake') {
      // Subterranean Pit Snake rising from underground dirt
      const snakeMat = new THREE.MeshStandardMaterial({ color: 0x1f3818, roughness: 0.6 });
      const dirtMat = new THREE.MeshStandardMaterial({ color: 0x2b1d0e, roughness: 0.9 });

      // Dirt Mound at base
      const dirtMound = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.4, 12), dirtMat);
      dirtMound.position.y = 0.2;

      // Serpent Body S-curve coils rising up
      const snakeGroup = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const segment = new THREE.Mesh(new THREE.CylinderGeometry(0.18 - i * 0.02, 0.2 - i * 0.02, 0.5, 10), snakeMat);
        const yPos = 0.2 + i * 0.4;
        const xOffset = Math.sin(i * 1.2) * 0.15;
        segment.position.set(xOffset, yPos, 0);
        snakeGroup.add(segment);
      }

      // Cobra Hood & Fanged Head
      const hood = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.1), snakeMat);
      hood.position.set(0, 2.4, 0.05);

      const head = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), snakeMat);
      head.rotation.x = Math.PI / 2;
      head.position.set(0, 2.4, 0.25);

      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04), eyeMat);
      eyeL.position.set(-0.1, 2.45, 0.38);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04), eyeMat);
      eyeR.position.set(0.1, 2.45, 0.38);

      group.add(dirtMound, snakeGroup, hood, head, eyeL, eyeR);
    } else if (type === 'winged_ice_skinwalker') {
      // Winged Frost Skinwalker with ice wings & translucent mist aura
      const frostSkinMat = new THREE.MeshStandardMaterial({ color: 0xdbf3ff, roughness: 0.3, metalness: 0.2 });
      const iceWingMat = new THREE.MeshStandardMaterial({ color: 0x80d8ff, transparent: true, opacity: 0.75, roughness: 0.2 });
      const iceGlowMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });

      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.2, 1.8, 8), frostSkinMat);
      torso.position.y = 1.4;

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 10), frostSkinMat);
      head.position.set(0, 2.4, 0.1);

      // Large Ice Wings
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.2), iceWingMat);
      wingL.position.set(-1.2, 1.8, -0.2);
      wingL.rotation.z = 0.35;

      const wingR = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.2), iceWingMat);
      wingR.position.set(1.2, 1.8, -0.2);
      wingR.rotation.z = -0.35;

      // Freezing eyes & frost point light
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05), iceGlowMat);
      eyeL.position.set(-0.09, 2.45, 0.3);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.05), iceGlowMat);
      eyeR.position.set(0.09, 2.45, 0.3);

      const frostLight = new THREE.PointLight(0x00e5ff, 1.5, 8);
      frostLight.position.set(0, 2.0, 0.3);

      group.add(torso, head, wingL, wingR, eyeL, eyeR, frostLight);
    } else if (type === 'stick_skinwalker_18ft') {
      // 18ft Tall Stick Skinwalker (5.5 Meters Tall, Extremely Skinny, Inverted Backwards Limbs!)
      const stickMat = new THREE.MeshStandardMaterial({ color: 0x14100d, roughness: 0.95 });
      const yellowGlowMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });

      // 18ft Height Scaling
      const scaleHeight = 5.5; // 5.5 meters = 18 feet

      // Ultra skinny torso (5.5m tall proportion)
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 2.5, 6), stickMat);
      torso.position.y = 3.2;

      // Inverted Backwards Knees / Legs
      const legLUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 1.8), stickMat);
      legLUpper.position.set(-0.3, 1.8, -0.3);
      legLUpper.rotation.x = -0.45; // bent backwards!

      const legLLower = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 1.8), stickMat);
      legLLower.position.set(-0.3, 0.5, 0.2);
      legLLower.rotation.x = 0.5;

      const legRUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 1.8), stickMat);
      legRUpper.position.set(0.3, 1.8, -0.3);
      legRUpper.rotation.x = -0.45;

      const legRLower = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 1.8), stickMat);
      legRLower.position.set(0.3, 0.5, 0.2);
      legRLower.rotation.x = 0.5;

      // Inverted Backwards Elbows & Arms
      const armLUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 2.2), stickMat);
      armLUpper.position.set(-0.5, 3.2, -0.4);
      armLUpper.rotation.x = -0.6; // arms reach backwards unnaturally!

      const armRUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 2.2), stickMat);
      armRUpper.position.set(0.5, 3.2, -0.4);
      armRUpper.rotation.x = -0.6;

      // Small Gaunt Head hovering at top (18 feet high)
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.3), stickMat);
      head.position.set(0, 4.6, 0.2);
      head.rotation.x = 0.3; // leaning forward towards player

      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05), yellowGlowMat);
      eyeL.position.set(-0.08, 4.62, 0.36);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.05), yellowGlowMat);
      eyeR.position.set(0.08, 4.62, 0.36);

      const earScreamLight = new THREE.PointLight(0xffea00, 2.0, 10);
      earScreamLight.position.set(0, 4.6, 0.4);

      group.add(
        torso, 
        legLUpper, legLLower, legRUpper, legRLower, 
        armLUpper, armRUpper, 
        head, eyeL, eyeR, earScreamLight
      );
    } else {
      // Standard zombie / striker - More anatomical structure
      const isStriker = type === 'striker_zombie';
      const mat = new THREE.MeshStandardMaterial({ 
        color: isStriker ? 0x3d2b1f : 0x26331f, 
        roughness: 0.9, 
        metalness: 0.05 
      });
      const skinMat = new THREE.MeshStandardMaterial({ color: 0x4a4a42, roughness: 0.9 });
      
      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.4), mat);
      torso.position.y = 1.2;
      
      // Shoulders/Upper Arms
      const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), mat);
      shoulderL.position.set(-0.4, 1.7, 0);
      const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), mat);
      shoulderR.position.set(0.4, 1.7, 0);
      
      // Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.4), skinMat);
      head.position.set(0, 2.1, 0);
      
      // Glowing Eyes
      const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.06), eyeMat);
      eye1.position.set(-0.12, 2.15, 0.22);
      const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.06), eyeMat);
      eye2.position.set(0.12, 2.15, 0.22);

      // Legs (elongated for striker)
      const legHeight = isStriker ? 1.4 : 1.0;
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, legHeight), mat);
      legL.position.set(-0.2, legHeight/2, 0);
      const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, legHeight), mat);
      legR.position.set(0.2, legHeight/2, 0);

      group.add(torso, shoulderL, shoulderR, head, eye1, eye2, legL, legR);
    }

    return group;
  }

  // --- CONTROLS & EVENT LISTENERS ---
  private setupEventListeners() {
    window.addEventListener('resize', this.onWindowResize);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('wheel', this.onWheel, { passive: true });

    // Touch support look around
    this.container.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.container.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.container.addEventListener('touchend', this.onTouchEnd);

    this.container.addEventListener('click', () => {
      if (!this.isLocked) {
        if (typeof this.container.requestPointerLock === 'function') {
          this.container.requestPointerLock();
        } else {
          // Mobile/Tablet and sandboxed iFrame fallback
          this.isLocked = true;
          this.callbacks.onGameEvent("TACTICAL COMBAT INTERACTIVE (Mobile/Touch Mode Active)");
        }
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.container;
    });
  }

  private onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  // Public UI API controllers
  public setMoveForward(val: boolean) { this.moveForward = val; }
  public setMoveBackward(val: boolean) { this.moveBackward = val; }
  public setMoveLeft(val: boolean) { this.moveLeft = val; }
  public setMoveRight(val: boolean) { this.moveRight = val; }
  public triggerShoot() { this.shoot(); }
  public triggerReload() { this.reload(); }

  private onKeyDown = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW': this.moveForward = true; break;
      case 'KeyS': this.moveBackward = true; break;
      case 'KeyA': this.moveLeft = true; break;
      case 'KeyD': this.moveRight = true; break;
      case 'Space': 
        if (this.isCrouched || this.isProne) {
          this.isCrouched = false;
          this.isProne = false;
          this.stats.isCrouched = false;
          this.stats.isProne = false;
          this.callbacks.onStatsChange({ ...this.stats });
        } else if (this.canJump) {
          this.velocity.y += this.config.jumpForce; 
          this.canJump = false; 
        }
        break;
      case 'ShiftLeft': 
        if (!this.isCrouched && !this.isProne) {
          this.stats.isSprinting = true; 
        }
        break;
      case 'KeyC':
      case 'ControlLeft':
        if (this.stats.isSprinting && (this.moveForward || this.moveLeft || this.moveRight || this.moveBackward) && !this.isSliding) {
          this.isSliding = true;
          this.stats.isSliding = true;
          this.slideTimer = this.slideDuration;
          
          const forwardDir = new THREE.Vector3();
          this.camera.getWorldDirection(forwardDir);
          forwardDir.y = 0;
          forwardDir.normalize();
          this.slideDirection.copy(forwardDir);
          
          soundEngine.playSlideSound();
          this.stats.isSprinting = false;
          this.isCrouched = true;
          this.stats.isCrouched = true;
          this.callbacks.onStatsChange({ ...this.stats });
        } else {
          this.isCrouched = !this.isCrouched;
          this.isProne = false;
          this.stats.isCrouched = this.isCrouched;
          this.stats.isProne = false;
          this.callbacks.onStatsChange({ ...this.stats });
        }
        break;
      case 'KeyZ':
        if (!this.isDolphinDiving) {
          this.isDolphinDiving = true;
          this.isCrouched = false;
          this.isProne = false;
          this.stats.isCrouched = false;
          this.stats.isProne = false;
          this.diveTimer = this.diveDuration;
          
          const forwardDir = new THREE.Vector3();
          this.camera.getWorldDirection(forwardDir);
          forwardDir.y = 0;
          forwardDir.normalize();
          this.diveDirection.copy(forwardDir);
          
          this.velocity.y = 3.8;
          this.canJump = false;
          
          soundEngine.playDiveSound();
          this.stats.isSprinting = false;
          this.callbacks.onStatsChange({ ...this.stats });
        }
        break;
      case 'KeyF':
        this.stats.isFlashlightOn = !this.stats.isFlashlightOn;
        this.flashlight.visible = this.stats.isFlashlightOn;
        soundEngine.playMechanicalClick(0.5, 1800);
        this.callbacks.onStatsChange({ ...this.stats });
        break;
      case 'KeyR': this.reload(); break;
      case 'Digit1': this.switchWeapon(0); break;
      case 'Digit2': this.switchWeapon(1); break;
      case 'Digit3': this.switchWeapon(2); break;
      case 'Digit4': this.switchWeapon(3); break;
      case 'Digit5': this.switchWeapon(4); break;
      case 'Digit6': this.switchWeapon(5); break;
      case 'KeyE': this.checkInteraction(); break;
      case 'Backquote':
        this.stats.isDebugActive = !this.stats.isDebugActive;
        this.callbacks.onGameEvent(`DEVELOPER DEBUG MODE: ${this.stats.isDebugActive ? 'ENABLED' : 'DISABLED'}`);
        this.callbacks.onStatsChange({ ...this.stats });
        break;
    }
  };

  private onWheel = (e: WheelEvent) => {
    if (e.deltaY > 0) {
      this.switchWeapon((this.weaponIndex + 1) % this.availableWeapons.length);
    } else if (e.deltaY < 0) {
      this.switchWeapon((this.weaponIndex - 1 + this.availableWeapons.length) % this.availableWeapons.length);
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW': this.moveForward = false; break;
      case 'KeyS': this.moveBackward = false; break;
      case 'KeyA': this.moveLeft = false; break;
      case 'KeyD': this.moveRight = false; break;
      case 'ShiftLeft': this.stats.isSprinting = false; break;
    }
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isLocked) return;
    const sensitivity = this.config.mouseSensitivity;
    const dx = e.movementX !== undefined ? e.movementX : 0;
    const dy = e.movementY !== undefined ? e.movementY : 0;

    this.yaw -= dx * sensitivity;
    this.pitch -= dy * sensitivity;

    // Clamp pitch
    this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));

    // Capture mouse sway (dampened inside update loop)
    this.mouseSwayX += dx * 0.01;
    this.mouseSwayY += dy * 0.01;
    this.mouseSwayX = Math.max(-0.5, Math.min(0.5, this.mouseSwayX));
    this.mouseSwayY = Math.max(-0.5, Math.min(0.5, this.mouseSwayY));
  };

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    if (this.lastTouchX !== null && this.lastTouchY !== null && e.touches.length > 0) {
      // Prevent browser bounce scroll on mobile screen look drag
      e.preventDefault();

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;

      const dx = currentX - this.lastTouchX;
      const dy = currentY - this.lastTouchY;

      this.lastTouchX = currentX;
      this.lastTouchY = currentY;

      // Smooth look sensitivity for finger drags
      const touchSensitivity = 0.0035;
      this.yaw -= dx * touchSensitivity;
      this.pitch -= dy * touchSensitivity;

      // Clamp camera vertical pitch
      this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));

      // Translate dragging motion directly into weapon sway vectors!
      this.mouseSwayX += dx * 0.018;
      this.mouseSwayY += dy * 0.018;
      this.mouseSwayX = Math.max(-0.5, Math.min(0.5, this.mouseSwayX));
      this.mouseSwayY = Math.max(-0.5, Math.min(0.5, this.mouseSwayY));
    }
  };

  private onTouchEnd = () => {
    this.lastTouchX = null;
    this.lastTouchY = null;
  };

  private onMouseDown = (e: MouseEvent) => {
    if (!this.isLocked) return;
    if (e.button === 0) {
      this.shoot();
    } else if (e.button === 2) {
      this.isAiming = true;
      this.camera.fov = 75 * this.currentWeapon.adsZoom;
      this.camera.updateProjectionMatrix();
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 2) {
      this.isAiming = false;
      this.camera.fov = 75;
      this.camera.updateProjectionMatrix();
    }
  };

  public switchWeapon(index: number) {
    if (index >= 0 && index < this.availableWeapons.length && !this.isReloading) {
      this.weaponIndex = index;
      const nextWeapon = { ...this.availableWeapons[index] };

      this.firstPersonRig.triggerSwitch(nextWeapon.id, () => {
        this.currentWeapon = nextWeapon;
        this.updateWeaponMesh();
        if (this.playerCharacterRig) {
          this.playerCharacterRig.setEquippedWeapon(nextWeapon.id);
        }
      });

      soundEngine.playMechanicalClick(0.6, 1100);
      this.callbacks.onWeaponChange({ ...nextWeapon });
    }
  }

  private checkInteraction() {
    // Distance to Indestructible Jeep
    const distJeep = this.playerPos.distanceTo(this.jeepPos);
    if (distJeep < 6) {
      this.isJeepMode = !this.isJeepMode;
      this.stats.inJeep = this.isJeepMode;
      soundEngine.playMechanicalClick(0.8, 800);
      this.callbacks.onGameEvent(this.isJeepMode ? '🚗 Boarded Indestructible 4x4 Jeep Mounted Cannon!' : 'Exited Jeep');
      this.callbacks.onStatsChange({ ...this.stats });
      return;
    }

    // Distance to Airplane
    const distPlane = this.playerPos.distanceTo(this.airplanePos);
    if (distPlane < 8) {
      this.isAirplaneMode = !this.isAirplaneMode;
      this.stats.inAirplane = this.isAirplaneMode;
      soundEngine.playMechanicalClick(0.8, 1200);
      this.callbacks.onGameEvent(this.isAirplaneMode ? '✈️ Boarded Recon Airplane Cockpit!' : 'Exited Airplane');
      this.callbacks.onStatsChange({ ...this.stats });
      return;
    }

    // Distance to MAC SUIT
    const distMac = this.playerPos.distanceTo(this.macSuitPos);
    if (distMac < 6) {
      this.isMacSuitMode = !this.isMacSuitMode;
      this.stats.inMacSuit = this.isMacSuitMode;
      soundEngine.playMechanicalClick(1.0, 500);
      this.callbacks.onGameEvent(this.isMacSuitMode ? '🤖 Boarded Heavy MAC SUIT Mech Combat Armor!' : 'Exited MAC Suit');
      this.callbacks.onStatsChange({ ...this.stats });
      return;
    }

    // Distance to Tank
    const distTank = this.playerPos.distanceTo(this.tankPos);
    if (distTank < 6) {
      this.isTankMode = !this.isTankMode;
      this.stats.inTank = this.isTankMode;
      soundEngine.playTankEngineRumble();
      this.callbacks.onGameEvent(this.isTankMode ? 'Boarded Army Tank Mounted Cannon' : 'Exited Army Tank');
      if (this.isTankMode) {
        this.switchWeapon(3); // minigun / heavy turret
      }
      this.callbacks.onStatsChange({ ...this.stats });
      return;
    }

    // Distance to Safehouse window telescope
    const distSafehouse = this.playerPos.distanceTo(this.safehousePos);
    if (distSafehouse < 8) {
      this.callbacks.onEnterSafehouseRest();
    }
  }

  public reload() {
    if (this.isReloading || this.currentWeapon.currentAmmo === this.currentWeapon.clipSize) return;
    if (this.currentWeapon.totalReserve <= 0) {
      soundEngine.playDryFire();
      return;
    }

    this.isReloading = true;
    this.firstPersonRig.triggerReload();
    const isDry = this.currentWeapon.currentAmmo === 0;

    // Select reload duration (Tactical is ~25% faster than standard, Dry is ~15% slower due to bolt rack)
    const duration = isDry ? this.currentWeapon.reloadTime * 1.15 : this.currentWeapon.reloadTime * 0.8;

    // Trigger appropriate audio cues
    if (isDry) {
      soundEngine.playDryReloadSound();
      this.callbacks.onGameEvent("DRY RELOAD (Chamber Empty - Racking Bolt!)");
    } else {
      soundEngine.playTacticalReloadSound();
      this.callbacks.onGameEvent("TACTICAL RELOAD (Fast Clip Swap - Bullet Chambered!)");
    }

    setTimeout(() => {
      const needed = this.currentWeapon.clipSize - this.currentWeapon.currentAmmo;
      const amount = Math.min(needed, this.currentWeapon.totalReserve);
      this.currentWeapon.currentAmmo += amount;
      this.currentWeapon.totalReserve -= amount;
      this.isReloading = false;
      this.callbacks.onWeaponChange({ ...this.currentWeapon });
    }, duration);
  }

  private shoot() {
    const now = performance.now();
    if (now - this.lastFireTime < this.currentWeapon.fireRate || this.isReloading) return;

    if (this.currentWeapon.currentAmmo <= 0) {
      soundEngine.playDryFire();
      return;
    }

    this.lastFireTime = now;
    this.currentWeapon.currentAmmo--;
    this.callbacks.onWeaponChange({ ...this.currentWeapon });

    // Throwable weapon check (Smoke Grenade or Frag Grenade)
    if (this.currentWeapon.id === 'smoke_grenade' || this.currentWeapon.id === 'grenade') {
      this.throwGrenade(this.currentWeapon.id);
      return;
    }

    // Gun sound
    soundEngine.playGunshot(this.currentWeapon.id);
    this.encounterDirector.emitSoundEvent('gunshot', this.playerPos, 110, 1.0);

    // Muzzle flash light
    this.muzzleFlashLight.position.copy(this.camera.position);
    this.muzzleFlashLight.intensity = 5;
    setTimeout(() => { this.muzzleFlashLight.intensity = 0; }, 50);

    // Recoil kick (pitching up camera)
    this.recoilPitch = this.currentWeapon.recoil;
    this.firstPersonRig.triggerRecoil(this.currentWeapon.recoil * 10);

    // Procedural weapon recoil springs (visual gun kickback)
    const kickFactor = this.isAiming ? 0.4 : 1.0;
    this.weaponRecoilOffset.set(0, 0, 0.09 * kickFactor);
    this.weaponRecoilRot.set(0.07 * kickFactor, (Math.random() - 0.5) * 0.03 * kickFactor, 0);

    // Procedural camera shake
    const shakeAmt = this.currentWeapon.recoil * (this.isAiming ? 0.5 : 1.5);
    this.camShake.set(
      (Math.random() - 0.5) * shakeAmt,
      (Math.random() - 0.5) * shakeAmt,
      (Math.random() - 0.5) * shakeAmt
    );

    // Raycast hit detection
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    const creatureMeshes = this.creatures.filter(c => c.state !== 'dead').map(c => c.mesh);
    const intersects = raycaster.intersectObjects(creatureMeshes, true);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object;
      const hitPoint = intersects[0].point;

      // Find creature parent
      let root: THREE.Object3D | null = hitObj;
      while (root && !root.userData.creatureId && root.parent && root.parent !== this.scene) {
        root = root.parent;
      }

      const creature = this.creatures.find(c => c.mesh === root || c.mesh === hitObj.parent || c.mesh === hitObj.parent?.parent);

      if (creature) {
        // Is headshot?
        const meshObj = hitObj as THREE.Mesh;
        const isHeadshot = meshObj.geometry instanceof THREE.SphereGeometry && meshObj.position.y > 1.4;
        const damage = isHeadshot ? this.currentWeapon.damage * 2.2 : this.currentWeapon.damage;

        const cVector = new THREE.Vector3(creature.position.x, creature.position.y, creature.position.z);
        creature.health -= damage;
        this.createBloodParticles(hitPoint);
        this.createBloodSpears(cVector);

        // Pain screams on hit/damage
        if (Math.random() < 0.6) {
          soundEngine.playCreatureSound('witch_scream');
        }

        // TRIGGER COD AUDIO & VISUAL "JUICE" (HITMARKERS!)
        this.hitMarkerTimer = 0.15;
        this.stats.isHitmarkerActive = true;
        soundEngine.playHitmarkerTick();

        if (this.currentWeapon.id === 'fast_guy') {
          // Fast Guy 6000-bullet multi-stream extra barrage impact
          this.createBloodSpears(cVector);
        } else if (this.currentWeapon.id === 'whip') {
          // Whip weapon incapacitates creature: stuns and forces creature to ground
          creature.stunTimer = 4.0;
          if (creature.mesh) {
            creature.mesh.position.y = Math.max(0, creature.mesh.position.y - 0.5); // falls to knees
          }
        } else if (this.currentWeapon.id === 'dragon_gun') {
          // Dragon Gun lightning burst energy impact
          this.createBloodSpears(cVector);
        }

        if (isHeadshot) {
          this.stats.headshots++;
          this.callbacks.onGameEvent(`CRITICAL HEADSHOT on ${creature.name}!`);
        }

        if (creature.health <= 0) {
          creature.state = 'dead';
          if (creature.visualController) {
            creature.visualController.playAnimation('death', false);
          }
          this.createBloodSpears(cVector);
          soundEngine.playCreatureSound('witch_scream');
          soundEngine.playCreatureSound('zombie');
          
          this.scene.remove(creature.mesh);
          this.stats.kills++;
          this.callbacks.onGameEvent(`ELIMINATED ${creature.name}! CREATURE SCREAMED IN AGONY!`);

          // Drop a weapon at the death coordinate
          this.spawnGunDrop(cVector);

          // Spawn replacement after delay
          setTimeout(() => {
            this.spawnCreaturesOfType(creature.type, 1);
          }, 6000);
        } else {
          if (creature.visualController) {
            creature.visualController.playAnimation('damage', false);
          }
        }

        this.callbacks.onStatsChange({ ...this.stats });
      }
    }
  }

  // --- THROWABLE GRENADES & ALLERGIC SMOKE CLOUD SYSTEM ---
  private throwGrenade(type: 'smoke_grenade' | 'grenade') {
    const grenadeGroup = new THREE.Group();

    if (type === 'smoke_grenade') {
      const canisterMat = new THREE.MeshStandardMaterial({ color: 0x2e6f40, roughness: 0.5 });
      const capMat = new THREE.MeshStandardMaterial({ color: 0xe6a100, roughness: 0.3 });
      const canister = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 12), canisterMat);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), capMat);
      cap.position.y = 0.2;
      grenadeGroup.add(canister, cap);
    } else {
      const fragMat = new THREE.MeshStandardMaterial({ color: 0x4a5d33, roughness: 0.7 });
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), fragMat);
      grenadeGroup.add(sphere);
    }

    const camPos = this.camera.position.clone();
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    grenadeGroup.position.copy(camPos).add(forward.clone().multiplyScalar(0.8));
    this.scene.add(grenadeGroup);

    const initialVelocity = forward.clone().multiplyScalar(22).add(new THREE.Vector3(0, 5, 0));

    this.thrownGrenades.push({
      mesh: grenadeGroup,
      velocity: initialVelocity,
      type,
      fuseTimer: 1.2,
      exploded: false
    });

    this.callbacks.onGameEvent(
      type === 'smoke_grenade'
        ? '💨 ALLERGIC SMOKE GRENADE THROWN!'
        : '💣 FRAG GRENADE THROWN!'
    );
  }

  private updateGrenades(delta: number) {
    // 1. Update thrown grenades in flight
    for (let i = this.thrownGrenades.length - 1; i >= 0; i--) {
      const g = this.thrownGrenades[i];
      g.fuseTimer -= delta;

      g.mesh.position.addScaledVector(g.velocity, delta);
      g.velocity.y -= 18 * delta; // gravity
      g.mesh.rotation.x += delta * 12;
      g.mesh.rotation.z += delta * 8;

      if (g.mesh.position.y <= 0.15 || g.fuseTimer <= 0) {
        if (!g.exploded) {
          g.exploded = true;
          this.detonateGrenade(g.type, g.mesh.position.clone());
          this.scene.remove(g.mesh);
          this.thrownGrenades.splice(i, 1);
        }
      }
    }

    // 2. Update active smoke clouds
    for (let i = this.activeSmokeClouds.length - 1; i >= 0; i--) {
      const cloud = this.activeSmokeClouds[i];
      cloud.duration -= delta;

      if (cloud.radius < 14) {
        cloud.radius += delta * 6;
        cloud.mesh.scale.set(cloud.radius, cloud.radius * 0.6, cloud.radius);
      }

      if (cloud.particles) {
        cloud.particles.rotation.y += delta * 0.4;
      }

      const cloudPos = cloud.position;
      this.creatures.forEach((creature) => {
        if (creature.state === 'dead') return;

        const cPos = new THREE.Vector3(creature.position.x, creature.position.y, creature.position.z);
        const dist = cPos.distanceTo(cloudPos);

        // A. ALLERGIC SMELL / SIGHT REACTION: Monsters smell smoke & run away!
        if (dist < cloud.radius + 18 && !creature.isTurtle) {
          creature.state = 'fleeing';

          const fleeDir = new THREE.Vector3().subVectors(cPos, cloudPos);
          fleeDir.y = 0;
          if (fleeDir.lengthSq() < 0.001) fleeDir.set(1, 0, 0);
          fleeDir.normalize();

          const moveDist = creature.speed * delta * 1.3;
          creature.position.x += fleeDir.x * moveDist;
          creature.position.z += fleeDir.z * moveDist;
          creature.mesh.position.x = creature.position.x;
          creature.mesh.position.z = creature.position.z;

          creature.mesh.lookAt(cPos.x + fleeDir.x, cPos.y, cPos.z + fleeDir.z);
        }

        // B. TURTLE TRANSFORMATION: Monsters touched by smoke turn into harmless turtles!
        if (dist <= cloud.radius && !creature.isTurtle) {
          creature.isTurtle = true;
          creature.name = `Confused Turtle 🐢 (${creature.type})`;
          creature.damage = 0; // Harmless!
          creature.speed = 0.6; // Slow crawl
          creature.state = 'fleeing';

          // Swap mesh to 3D procedural turtle
          if (creature.mesh) {
            this.scene.remove(creature.mesh);
          }
          const turtleGroup = this.createTurtleMesh();
          turtleGroup.position.set(creature.position.x, 0, creature.position.z);
          this.scene.add(turtleGroup);
          creature.mesh = turtleGroup;
          creature.visualController = null;

          soundEngine.playHitmarkerTick();
          this.callbacks.onGameEvent('🐢 MONSTER TOUCHED ALLERGIC SMOKE AND TURNED INTO A TURTLE!');
          this.callbacks.onStatsChange({ ...this.stats });
        }
      });

      if (cloud.duration <= 0) {
        this.scene.remove(cloud.mesh);
        this.activeSmokeClouds.splice(i, 1);
      }
    }
  }

  private detonateGrenade(type: 'smoke_grenade' | 'grenade', pos: THREE.Vector3) {
    if (type === 'smoke_grenade') {
      const cloudGroup = new THREE.Group();
      cloudGroup.position.copy(pos);

      const particleCount = 220;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random();
        positions[i * 3] = Math.cos(angle) * r;
        positions[i * 3 + 1] = Math.random() * 0.8;
        positions[i * 3 + 2] = Math.sin(angle) * r;

        colors[i * 3] = 0.2 + Math.random() * 0.15;
        colors[i * 3 + 1] = 0.6 + Math.random() * 0.3;
        colors[i * 3 + 2] = 0.3 + Math.random() * 0.2;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.65,
        depthWrite: false
      });

      const particles = new THREE.Points(geometry, material);
      cloudGroup.add(particles);

      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x3d6b38,
        transparent: true,
        opacity: 0.5,
        roughness: 0.9
      });
      const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 12), coreMat);
      cloudGroup.add(coreSphere);

      this.scene.add(cloudGroup);

      this.activeSmokeClouds.push({
        mesh: cloudGroup,
        particles,
        position: pos,
        radius: 3,
        duration: 14.0,
        maxDuration: 14.0
      });

      soundEngine.playDryReloadSound();
      this.callbacks.onGameEvent('💨 ALLERGIC SMOKE CLOUD BILLOWING! MONSTERS ARE FLEEING!');
    } else {
      soundEngine.playGunshot('tank_turret');

      const expLight = new THREE.PointLight(0xffaa22, 15, 20);
      expLight.position.copy(pos);
      this.scene.add(expLight);
      setTimeout(() => { this.scene.remove(expLight); }, 200);

      this.creatures.forEach((creature) => {
        if (creature.state === 'dead') return;
        const cPos = new THREE.Vector3(creature.position.x, creature.position.y, creature.position.z);
        const dist = cPos.distanceTo(pos);

        if (dist < 12.0) {
          const damage = Math.round(250 * (1.0 - dist / 12.0));
          creature.health -= damage;
          this.createBloodParticles(cPos);

          if (creature.health <= 0) {
            creature.state = 'dead';
            if (creature.visualController) creature.visualController.playAnimation('death', false);
            this.scene.remove(creature.mesh);
            this.stats.kills++;
            this.callbacks.onGameEvent(`💣 FRAG BLAST DECIMATED ${creature.name}!`);
          }
        }
      });

      this.callbacks.onStatsChange({ ...this.stats });
    }
  }

  private createBloodParticles(pos: THREE.Vector3) {
    const pGeo = new THREE.BufferGeometry();
    const pCount = 18;
    const positions = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount * 3; i += 3) {
      positions[i] = pos.x + (Math.random() - 0.5) * 0.4;
      positions[i + 1] = pos.y + (Math.random() - 0.5) * 0.4;
      positions[i + 2] = pos.z + (Math.random() - 0.5) * 0.4;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x880000, size: 0.12 });
    const pSystem = new THREE.Points(pGeo, pMat);
    this.particleGroup.add(pSystem);

    setTimeout(() => {
      this.particleGroup.remove(pSystem);
    }, 400);
  }

  private createBloodSpears(pos: THREE.Vector3) {
    const spearGroup = new THREE.Group();
    const spearMat = new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.2, metalness: 0.3 });

    // Blood spears shooting from Head, Torso, Left Arm, Right Arm, Left Leg, Right Leg
    const bodyPoints = [
      { x: pos.x, y: pos.y + 1.8, z: pos.z }, // Head
      { x: pos.x, y: pos.y + 1.1, z: pos.z }, // Torso
      { x: pos.x - 0.5, y: pos.y + 1.2, z: pos.z }, // Left Arm
      { x: pos.x + 0.5, y: pos.y + 1.2, z: pos.z }, // Right Arm
      { x: pos.x - 0.3, y: pos.y + 0.4, z: pos.z }, // Left Leg
      { x: pos.x + 0.3, y: pos.y + 0.4, z: pos.z }  // Right Leg
    ];

    bodyPoints.forEach((pt) => {
      for (let s = 0; s < 3; s++) {
        const spear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 1.2, 6), spearMat);
        spear.position.set(pt.x, pt.y, pt.z);

        const dir = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 1.5 + 0.2,
          (Math.random() - 0.5) * 2
        ).normalize();

        const up = new THREE.Vector3(0, 1, 0);
        spear.quaternion.setFromUnitVectors(up, dir);
        spearGroup.add(spear);
      }
    });

    this.particleGroup.add(spearGroup);

    const startTime = performance.now();
    const animateSpears = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed < 0.5) {
        spearGroup.children.forEach((s) => {
          s.position.addScaledVector(s.up, 2.5 * 0.016);
        });
        requestAnimationFrame(animateSpears);
      } else {
        this.particleGroup.remove(spearGroup);
      }
    };
    requestAnimationFrame(animateSpears);
  }

  // --- MAIN ANIMATION & AI LOOP ---
  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Process player movement, AI, and timers (runs regardless of lock status to support mobile touch buttons and sandbox iframe environments)
    const isGameplayActive = true; 

    if (isGameplayActive) {
      // 1. Sliding & Diving timers
      if (this.slideTimer > 0) {
        this.slideTimer -= delta;
        if (this.slideTimer <= 0) {
          this.isSliding = false;
          this.stats.isSliding = false;
          this.callbacks.onStatsChange({ ...this.stats });
        }
      }

      if (this.diveTimer > 0) {
        this.diveTimer -= delta;
        if (this.diveTimer <= 0) {
          this.isDolphinDiving = false;
          this.isProne = true;
          this.stats.isProne = true;
          this.callbacks.onStatsChange({ ...this.stats });
        }
      }

      // 2. Hitmarker timing decay
      if (this.hitMarkerTimer > 0) {
        this.hitMarkerTimer -= delta;
        if (this.hitMarkerTimer <= 0) {
          this.stats.isHitmarkerActive = false;
          this.callbacks.onStatsChange({ ...this.stats });
        }
      }

      this.updateMovement(delta);
      this.encounterDirector.update(delta, now, this.playerPos, this.creatures, {
        onEventMsg: (msg) => this.callbacks.onGameEvent(msg)
      });
      this.stats.directorState = this.encounterDirector.state;
      this.updateCreatureAI(delta, now);
      this.updateOverlays(delta);
      this.checkGunDrops(delta);
      this.updateGrenades(delta);

      // Realism Rig & Forest Environment Updates
      this.forestEnv.update(delta, this.playerPos);
      this.firstPersonRig.update(
        delta, 
        this.velocity.length(), 
        this.mouseSwayX, 
        this.mouseSwayY, 
        this.isAiming,
        this.stats.isSprinting
      );
      if (this.playerCharacterRig) {
        this.playerCharacterRig.update(
          delta,
          this.velocity.length(),
          0,
          new THREE.Vector3(this.mouseSwayX, this.mouseSwayY, -1),
          this.isAiming,
          this.stats.isSprinting
        );
      }
      this.storyNpcs.forEach((npc) => {
        npc.rig.update(delta, 0, 0, new THREE.Vector3(0, 0, -1), false, false);
      });
      
      this.creatures.forEach(c => {
        if(c.visualController) c.visualController.update(delta);
      });
    }

    // 3. Flashlight tracking camera
    if (this.stats.isFlashlightOn) {
      this.flashlight.position.copy(this.camera.position);
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      this.flashlight.target.position.copy(this.camera.position).add(dir.multiplyScalar(10));
    }

    // 4. Decay camera pitch recoil
    if (this.recoilPitch > 0) {
      this.recoilPitch = Math.max(0, this.recoilPitch - delta * 4.0); // faster, crisper COD decay
    }

    // 5. Decay weapon procedural recoil springs
    this.weaponRecoilOffset.multiplyScalar(Math.exp(-delta * 14.0));
    this.weaponRecoilRot.multiplyScalar(Math.exp(-delta * 14.0));

    // 6. Decay camera physical shake
    this.camShake.multiplyScalar(Math.exp(-delta * 16.0));

    // 7. Decay weapon mouse sway
    this.mouseSwayX = THREE.MathUtils.lerp(this.mouseSwayX, 0, delta * 8.0);
    this.mouseSwayY = THREE.MathUtils.lerp(this.mouseSwayY, 0, delta * 8.0);

    // 8. Aim Down Sights (ADS) lerp interpolation
    const adsSpeed = this.currentWeapon.id === 'sniper' ? 10.0 : 14.0;
    if (this.isAiming) {
      this.adsInterpolation = THREE.MathUtils.lerp(this.adsInterpolation, 1.0, delta * adsSpeed);
    } else {
      this.adsInterpolation = THREE.MathUtils.lerp(this.adsInterpolation, 0.0, delta * adsSpeed);
    }

    // 9. Update Weapon mesh positioning relative to camera (Hip fire vs. ADS)
    const hipPos = new THREE.Vector3(0.22, -0.2, -0.45);
    if (this.currentWeapon.id === 'shotgun') hipPos.set(0.24, -0.22, -0.48);
    if (this.currentWeapon.id === 'sniper') hipPos.set(0.25, -0.22, -0.5);
    if (this.currentWeapon.id === 'minigun') hipPos.set(0.28, -0.25, -0.45);

    const adsPos = new THREE.Vector3(0, -0.09, -0.3); // EXACT CENTER ALIGNED FOR ADS!

    const weaponPos = new THREE.Vector3().lerpVectors(hipPos, adsPos, this.adsInterpolation);

    // Apply weapon sway to position offset
    const swayScale = this.isAiming ? 0.08 : 0.25; // significantly reduced sway when aiming down sights
    weaponPos.x -= this.mouseSwayX * 0.04 * swayScale;
    weaponPos.y += this.mouseSwayY * 0.04 * swayScale;

    // Apply procedural recoil backward kickback
    weaponPos.add(this.weaponRecoilOffset);

    this.weaponMeshGroup.position.copy(weaponPos);

    // Apply rotation including sway, recoil pitch kick, and slide tilt
    const slideTilt = this.isSliding ? 0.22 : 0;
    this.weaponMeshGroup.rotation.set(
      this.weaponRecoilRot.x + this.mouseSwayY * 0.05 * swayScale,
      -this.mouseSwayX * 0.06 * swayScale,
      -this.mouseSwayX * 0.15 * swayScale - slideTilt,
      'XYZ'
    );

    // 10. Frame-rate independent Camera Rotation setting (yaw, pitch + recoil, and head-bob shoulder roll)
    this.camera.rotation.set(this.pitch + this.recoilPitch, this.yaw, this.cameraRoll, 'YXZ');

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  };

  private updateMovement(delta: number) {
    // Stamina calculation
    const isMoving = this.moveForward || this.moveLeft || this.moveRight || this.moveBackward;
    if (this.stats.isSprinting && isMoving && !this.isCrouched && !this.isProne && !this.isSliding && !this.isDolphinDiving) {
      this.stats.stamina = Math.max(0, this.stats.stamina - delta * 25);
      if (this.stats.stamina < 15) {
        this.stats.isBreathingHeavy = true;
        soundEngine.playHeavyBreathing(0.8);
      }
    } else {
      this.stats.stamina = Math.min(this.stats.maxStamina, this.stats.stamina + delta * 18);
      if (this.stats.stamina > 40 && this.stats.health > 40) {
        this.stats.isBreathingHeavy = false;
      }
    }

    // Determine target eye height and speed
    let actualSpeed = this.config.baseSpeed;
    this.targetEyeHeight = 1.7;

    if (this.isDolphinDiving) {
      actualSpeed = this.config.baseSpeed * 1.5;
      this.targetEyeHeight = 0.5; // low dive
    } else if (this.isSliding) {
      // Slashing decay speed multiplier
      const progress = this.slideTimer / this.slideDuration; // 1 to 0
      actualSpeed = this.config.baseSpeed * (1.0 + 1.2 * progress);
      this.targetEyeHeight = 0.9;
    } else if (this.isProne) {
      actualSpeed = this.config.proneSpeed;
      this.targetEyeHeight = 0.4;
    } else if (this.isCrouched) {
      actualSpeed = this.config.crouchSpeed;
      this.targetEyeHeight = 0.9;
    } else {
      // Standard standing stance
      const speedMultiplier = this.stats.isSprinting && this.stats.stamina > 5 ? this.config.sprintMultiplier : 1.0;
      actualSpeed = this.config.baseSpeed * speedMultiplier;
    }

    // Apply ADS Aim-Walking Speed dampener (Tactical slow walking while aiming)
    if (this.isAiming && !this.isSliding && !this.isDolphinDiving) {
      actualSpeed *= 0.45; 
    }

    // Process active creature status effects (Ice Frozen & Underground Pull)
    if (this.stats.iceFrozenTimer && this.stats.iceFrozenTimer > 0) {
      this.stats.iceFrozenTimer -= delta;
      if (this.stats.iceFrozenTimer <= 0) this.stats.iceFrozenTimer = 0;
      actualSpeed = 0; // Frozen completely solid in ice!
    }

    if (this.stats.undergroundPullTimer && this.stats.undergroundPullTimer > 0) {
      this.stats.undergroundPullTimer -= delta;
      if (this.stats.undergroundPullTimer <= 0) this.stats.undergroundPullTimer = 0;
      this.targetEyeHeight = 0.25; // Pulled underground into soil pit!
    }

    // Decaying velocity damping
    const currentDecel = isMoving ? this.config.accelerationDamping : this.config.decelerationDamping;
    this.velocity.x -= this.velocity.x * currentDecel * delta;
    this.velocity.z -= this.velocity.z * currentDecel * delta;
    this.velocity.y -= this.config.gravity * delta; // Gravity

    // Process sliding/diving active forces or standard WASD
    if (this.isDolphinDiving) {
      this.velocity.z = -this.diveDirection.z * actualSpeed;
      this.velocity.x = this.diveDirection.x * actualSpeed;
    } else if (this.isSliding) {
      this.velocity.z = -this.slideDirection.z * actualSpeed;
      this.velocity.x = this.slideDirection.x * actualSpeed;
    } else {
      this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
      this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
      this.direction.normalize();

      if (isMoving) {
        this.velocity.z -= this.direction.z * actualSpeed * currentDecel * delta;
        this.velocity.x -= this.direction.x * actualSpeed * currentDecel * delta;
      }
    }

    // Camera space directions
    const dirX = new THREE.Vector3();
    const dirZ = new THREE.Vector3();
    this.camera.getWorldDirection(dirZ);
    dirZ.y = 0;
    dirZ.normalize();

    dirX.crossVectors(this.camera.up, dirZ).normalize();

    // Perform translation
    this.playerPos.addScaledVector(dirZ, -this.velocity.z * delta);
    this.playerPos.addScaledVector(dirX, this.velocity.x * delta);
    this.playerPos.y += this.velocity.y * delta;

    // Floor collision
    if (this.playerPos.y <= 1.7) {
      this.velocity.y = 0;
      this.playerPos.y = 1.7;
      this.canJump = true;

      // Handle dive landing thud
      if (this.isDolphinDiving) {
        this.isDolphinDiving = false;
        this.diveTimer = 0;
        this.isProne = true;
        this.stats.isProne = true;
        this.callbacks.onStatsChange({ ...this.stats });
      }
    }

    // Smoothly interpolate eye height (crouching, sliding, diving transition)
    this.eyeHeight = THREE.MathUtils.lerp(this.eyeHeight, this.targetEyeHeight, delta * 12.0);

    // Apply baseline position to camera
    this.camera.position.copy(this.playerPos);
    this.camera.position.y = this.playerPos.y - 1.7 + this.eyeHeight;

    // Head bobbing computation
    const horizontalVelocitySq = this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z;
    if (horizontalVelocitySq > 0.1 && this.canJump) {
      let bobSpeed = this.config.bobFrequency;
      let bobAmpX = this.config.bobAmplitudeX;
      let bobAmpY = this.config.bobAmplitudeY;

      if (this.stats.isSprinting && !this.isCrouched && !this.isProne) {
        bobSpeed = this.config.bobFrequency * this.config.sprintBobMultiplier;
        bobAmpX = this.config.bobAmplitudeX * 2.0;
        bobAmpY = this.config.bobAmplitudeY * 1.8;
      } else if (this.isCrouched) {
        bobSpeed = this.config.bobFrequency * 0.625;
        bobAmpX = this.config.bobAmplitudeX * 0.5;
        bobAmpY = this.config.bobAmplitudeY * 0.5;
      } else if (this.isProne) {
        bobSpeed = this.config.bobFrequency * 0.375;
        bobAmpX = this.config.bobAmplitudeX * 0.25;
        bobAmpY = this.config.bobAmplitudeY * 0.25;
      }

      this.bobTime += delta * bobSpeed;
      const bobX = Math.cos(this.bobTime * 0.5) * bobAmpX;
      const bobY = Math.sin(this.bobTime) * bobAmpY;

      this.camera.position.x += bobX;
      this.camera.position.y += bobY;

      // Dynamic shoulder-roll tilting during walk gait
      const rollAmount = this.stats.isSprinting && !this.isCrouched && !this.isProne 
        ? this.config.cameraRollWeight * 2.75 
        : this.config.cameraRollWeight;
      this.cameraRoll = Math.sin(this.bobTime * 0.5) * rollAmount;

      // Detect footing surface dynamically (Grass, Wood/Concrete, or Metal)
      let activeSurface: 'grass' | 'wood' | 'metal' = 'grass';

      // Safehouse interior floor bounds (Safehouse is at (0, 0, 45) bounding width 14 and depth 12)
      const insideSafehouseX = Math.abs(this.playerPos.x - this.safehousePos.x) < 7.0;
      const insideSafehouseZ = Math.abs(this.playerPos.z - this.safehousePos.z) < 6.0;
      
      // Tank deck footing bounds (Tank is at (0, 0, -25) and boarding distance is < 4)
      const nearTank = this.playerPos.distanceTo(this.tankPos) < 4.0;
      
      // Concrete corridor pathway bounds (Spans x: -2.5 to 2.5, z: -35 to 55)
      const onConcretePath = Math.abs(this.playerPos.x) < 2.5 && this.playerPos.z > -35.0 && this.playerPos.z < 55.0;

      const surface = this.forestEnv.getSurfaceTypeAtPosition(this.playerPos.x, this.playerPos.z);

      // Play footstep sounds depending on sprint speed and dynamic surface
      if (Math.random() < delta * (this.stats.isSprinting ? 5.5 : 3.2)) {
        soundEngine.playFootstep(this.stats.isSprinting, surface);
      }
    } else {
      this.cameraRoll = THREE.MathUtils.lerp(this.cameraRoll, 0, delta * 8.0);
    }

    // Apply Camera Shake offset
    this.camera.position.add(this.camShake);

    this.callbacks.onStatsChange({ ...this.stats });
  }

  // --- CREATURE AI BEHAVIOR ---
  private updateCreatureAI(delta: number, now: number) {
    if (this.skinwalkerJumpScareCooldown > 0) {
      this.skinwalkerJumpScareCooldown -= delta;
    }

    this.creatures.forEach((creature) => {
      if (creature.state === 'dead') return;
      
      // Whip Stunned / Incapacitated State
      if (creature.stunTimer && creature.stunTimer > 0) {
        creature.stunTimer -= delta;
        if (creature.stunTimer <= 0) {
          creature.stunTimer = 0;
          if (creature.mesh && !creature.isTurtle) {
            creature.mesh.position.y = 0; // return to standing
          }
        }
        return; // Stunned creatures remain incapacitated on ground!
      }

      // Peaceful Turtle State Handling
      if (creature.isTurtle) {
        creature.idleTimer = (creature.idleTimer || 0) + delta * 1.5;
        creature.mesh.rotation.y += Math.sin(creature.idleTimer) * 0.015;
        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), creature.mesh.rotation.y);
        creature.mesh.position.addScaledVector(forward, creature.speed * delta);
        creature.position.x = creature.mesh.position.x;
        creature.position.z = creature.mesh.position.z;
        return; // Turtles do not attack or chase!
      }

      // Fleeing State Handling (Smelled/saw allergic smoke cloud)
      if (creature.state === 'fleeing') {
        if (creature.visualController) {
          creature.visualController.playAnimation('movement', true);
        }
        return; // Fleeing creatures run away and do not attack player!
      }

      // Update procedural idle movement or animation state
      creature.idleTimer = (creature.idleTimer || 0) + delta * 2.0;
      if (creature.state === 'idle') {
        creature.mesh.position.y += Math.sin(creature.idleTimer) * 0.005; // breathing
        creature.mesh.rotation.y += Math.sin(creature.idleTimer * 0.5) * 0.002; // subtle idle sway
        if (creature.visualController) {
          creature.visualController.playAnimation('idle', true);
        }
      } else if (creature.state === 'chasing') {
        if (creature.visualController) {
          creature.visualController.playAnimation('movement', true);
        }
      }

      const cPos = creature.mesh.position;
      const distToPlayer = cPos.distanceTo(this.playerPos);

      // --- 1. INVESTIGATE SOUND STATE ---
      if (creature.state === 'investigate' && creature.investigateTargetPos) {
        const invTarget = new THREE.Vector3(creature.investigateTargetPos.x, cPos.y, creature.investigateTargetPos.z);
        const distToSound = cPos.distanceTo(invTarget);

        if (distToSound > 2.0) {
          const dir = new THREE.Vector3().subVectors(invTarget, cPos).normalize();
          cPos.addScaledVector(dir, creature.speed * 0.5 * delta);
          creature.mesh.lookAt(invTarget.x, cPos.y, invTarget.z);
          if (creature.visualController) creature.visualController.playAnimation('movement', true);
        } else {
          // Reached sound origin -> transition to search nearby area
          creature.state = 'search';
          creature.searchTimer = 5.0;
        }
      }

      // --- 2. SEARCH AREA STATE ---
      if (creature.state === 'search') {
        creature.searchTimer = (creature.searchTimer || 0) - delta;
        creature.mesh.rotation.y += Math.sin(now * 0.003) * 0.02; // looking around
        if (creature.visualController) creature.visualController.playAnimation('idle', true);

        if ((creature.searchTimer || 0) <= 0) {
          creature.state = 'idle';
          creature.investigateTargetPos = null;
        }
      }

      // --- 3. LINE OF SIGHT & PLAYER DETECTION ---
      if (distToPlayer < 22.0 && creature.state !== 'chasing' && creature.state !== 'chase' && (creature.state as string) !== 'fleeing') {
        const playerDir = new THREE.Vector3().subVectors(this.playerPos, cPos).normalize();
        const creatureForward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), creature.mesh.rotation.y);

        // Detect if player is close or in front view cone or making sprinting noise
        const isSprintingNoise = this.stats.isSprinting && distToPlayer < 18.0;
        const isInViewCone = creatureForward.dot(playerDir) > 0.3 && distToPlayer < 16.0;

        if (distToPlayer < 6.0 || isInViewCone || isSprintingNoise) {
          creature.state = 'chasing';
          creature.lastKnownPlayerPos = this.playerPos.clone();
        }
      }

      // --- 4. LOSE PLAYER & BREAK LINE OF SIGHT ---
      if ((creature.state === 'chasing' || creature.state === 'chase') && distToPlayer > 28.0) {
        creature.state = 'search';
        creature.searchTimer = 6.0;
        creature.lastKnownPlayerPos = this.playerPos.clone();
      }

      // --- SKINWALKER PSYCHOLOGICAL HORROR JUMP-SCARE ---
      if (creature.type === 'skinwalker' && distToPlayer < 4.5 && !this.stats.skinwalkerJumpScareActive && this.skinwalkerJumpScareCooldown <= 0) {
        this.stats.skinwalkerJumpScareActive = true;
        this.skinwalkerJumpScareCooldown = 15.0; // 15s cooldown

        soundEngine.playCreatureSound('witch_scream');
        soundEngine.playCreatureSound('skinwalker');
        setTimeout(() => soundEngine.playCreatureSound('skinwalker'), 350);
        setTimeout(() => soundEngine.playCreatureSound('witch_scream'), 700);

        this.callbacks.onGameEvent('⚠️ SKINWALKER MIND SCARE!');
        this.callbacks.onStatsChange({ ...this.stats });

        setTimeout(() => {
          this.stats.skinwalkerJumpScareActive = false;
          this.stats.health = Math.max(1, this.stats.health - 0.5);
          this.stats.bloodOnScreen = 0.95;
          this.callbacks.onStatsChange({ ...this.stats });
        }, 1800);
      }

      // --- CRYING WITCH SPECIAL LOGIC ---
      if (creature.type === 'crying_witch') {
        if (!creature.isEnraged) {
          if (Math.random() < 0.02) soundEngine.playCreatureSound('witch_crying');

          if (this.stats.isFlashlightOn && distToPlayer < 20) {
            const playerDir = new THREE.Vector3();
            this.camera.getWorldDirection(playerDir);
            const toWitch = new THREE.Vector3().subVectors(cPos, this.playerPos).normalize();

            if (playerDir.dot(toWitch) > 0.75) {
              creature.isEnraged = true;
              creature.state = 'chasing';
              soundEngine.playCreatureSound('witch_scream');
              this.callbacks.onGameEvent('THE CRYING WITCH HAS BEEN ENRAGED BY YOUR FLASHLIGHT!');
            }
          }
          return;
        }
      }

      // --- 5. CHASE & ATTACK LOGIC ---
      if (creature.state === 'chasing' || creature.state === 'chase') {
        if (creature.visualController) creature.visualController.playAnimation('movement', true);

        const dir = new THREE.Vector3().subVectors(this.playerPos, cPos);
        dir.y = 0;
        dir.normalize();

        cPos.addScaledVector(dir, creature.speed * delta);
        creature.position.x = cPos.x;
        creature.position.z = cPos.z;

        creature.mesh.lookAt(this.playerPos.x, cPos.y, this.playerPos.z);

        if (distToPlayer <= creature.attackRange && now - creature.lastAttackTime > creature.attackCooldown) {
          creature.lastAttackTime = now;
          this.performCreatureAttack(creature);
        }
      }
    });
  }

  private performCreatureAttack(creature: Creature) {
    if (creature.isTurtle || creature.damage <= 0 || creature.state === 'fleeing') return;
    if (this.isJeepMode) {
      // The Jeep is 100% INDESTRUCTIBLE! Creature attacks cannot damage the player or Jeep!
      return;
    }

    // Sloth-like health depletion (takes 3 to 7 hours until all 18 hearts can go down!)
    const slothDamage = Math.min(0.04, creature.damage * 0.002);
    this.stats.health = Math.max(0, this.stats.health - slothDamage);

    if (creature.visualController) {
      creature.visualController.playAnimation('attack', false);
    }

    if (creature.type === 'double_tank') {
      // Double tank crushing punch!
      soundEngine.playCreatureSound('double_tank');
      soundEngine.playBloodCough();
      this.stats.coughedBlood = true;
      this.stats.bloodOnScreen = 1.0;
      this.recoilPitch = 0.15; // violent camera jerk
      this.callbacks.onGameEvent('DOUBLE TANK DELIVERED A CRUSHING PUNCH! YOU COUGHED BLOOD!');
    } else if (creature.type === 'jockey_9tentacles') {
      // 9-tentacle jockey green acid spit!
      soundEngine.playCreatureSound('jockey');
      this.stats.greenAcidOnScreen = 1.0;
      this.callbacks.onGameEvent('9-TENTACLE JOCKEY SPIT GREEN ACID IN YOUR FACE!');
    } else if (creature.type === 'cloud_creature') {
      soundEngine.playCreatureSound('cloud_creature');
      this.stats.whiteMistOnScreen = 1.0;
    } else if (creature.type === 'crying_witch') {
      soundEngine.playCreatureSound('witch_scream');
      this.stats.bloodOnScreen = 1.0;
      this.callbacks.onGameEvent('CRYING WITCH IS RIPPING PIECES OFF YOU!');
    } else if (creature.type === 'blood_spider') {
      soundEngine.playCreatureSound('blood_spider');
      this.stats.spiderBloodDrainActive = true;
      this.stats.bloodOnScreen = 1.0;
      this.callbacks.onGameEvent('⚠️ GIANT BLOOD SPIDER JUMPED ON YOU & IS SUCKING YOUR BLOOD!');
      setTimeout(() => {
        this.stats.spiderBloodDrainActive = false;
        this.callbacks.onStatsChange({ ...this.stats });
      }, 3000);
    } else if (creature.type === 'subterranean_snake') {
      soundEngine.playCreatureSound('subterranean_snake');
      this.stats.undergroundPullTimer = 2.5;
      this.recoilPitch = -0.25; // sharp downward camera jerk as pulled underground
      this.callbacks.onGameEvent('⚠️ SUBTERRANEAN SNAKE BIT YOU FROM THE GROUND & PULLED YOU UNDERGROUND!');
    } else if (creature.type === 'winged_ice_skinwalker') {
      soundEngine.playCreatureSound('winged_ice_skinwalker');
      this.stats.iceFrozenTimer = 2.8; // freeze player in place for 2.8s
      this.stats.whiteMistOnScreen = 1.0;
      this.callbacks.onGameEvent('⚠️ WINGED FROST SKINWALKER BLASTED ICE MIST! YOU ARE FROZEN IN PLACE!');
    } else if (creature.type === 'stick_skinwalker_18ft') {
      soundEngine.playCreatureSound('stick_skinwalker_18ft');
      this.stats.earScreamScareActive = true;
      this.camShake.set((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4);
      this.callbacks.onGameEvent('⚠️ 18FT STICK SKINWALKER BENT DOWN & SCREAMED DIRECTLY INTO YOUR EAR!');
      setTimeout(() => {
        this.stats.earScreamScareActive = false;
        this.callbacks.onStatsChange({ ...this.stats });
      }, 2000);
    } else {
      soundEngine.playCreatureSound(creature.type as any);
      this.stats.bloodOnScreen = Math.min(1.0, this.stats.bloodOnScreen + 0.4);
    }

    if (this.stats.health <= 0) {
      this.stats.health = 0;
      this.callbacks.onGameOver(false);
    }

    this.callbacks.onStatsChange({ ...this.stats });
  }

  private spawnGunDrop(pos: { x: number; y: number; z: number }) {
    // 50% chance of dropping a weapon on standard zombie/striker/etc deaths
    const dropChance = 0.5;
    if (Math.random() > dropChance) return;

    // Pick weapon type: 45% AK-47, 30% Shotgun, 25% Sniper
    let type: WeaponType = 'ak47';
    const rand = Math.random();
    if (rand < 0.45) {
      type = 'ak47';
    } else if (rand < 0.75) {
      type = 'shotgun';
    } else {
      type = 'sniper';
    }

    const gunMeshGroup = new THREE.Group();

    // 3D Geometry to represent the weapon
    const bodyMat = new THREE.MeshStandardMaterial({
      color: type === 'ak47' ? 0xcc6600 : (type === 'shotgun' ? 0x11ff11 : 0x00ffff),
      metalness: 0.9,
      roughness: 0.1,
      emissive: type === 'ak47' ? 0x331100 : (type === 'shotgun' ? 0x003300 : 0x001133)
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.15), bodyMat);
    body.position.y = 0.45;
    gunMeshGroup.add(body);

    // Glowing point light above it
    const light = new THREE.PointLight(type === 'ak47' ? 0xff4400 : (type === 'shotgun' ? 0x00ff00 : 0x00ffff), 4, 6);
    light.position.y = 0.7;
    gunMeshGroup.add(light);

    // Beautiful glowing ring under the weapon
    const ringGeo = new THREE.TorusGeometry(0.6, 0.04, 8, 24);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: type === 'ak47' ? 0xff6600 : (type === 'shotgun' ? 0x00ff00 : 0x00ffff),
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.05;
    gunMeshGroup.add(ring);

    gunMeshGroup.position.set(pos.x, 0.1, pos.z);
    this.scene.add(gunMeshGroup);

    this.gunDrops.push({
      type,
      position: new THREE.Vector3(pos.x, 0.1, pos.z),
      mesh: gunMeshGroup
    });
  }

  private checkGunDrops(delta: number) {
    for (let i = this.gunDrops.length - 1; i >= 0; i--) {
      const drop = this.gunDrops[i];

      // Rotate slowly to make it look floating & interactive
      drop.mesh.rotation.y += delta * 1.8;
      drop.mesh.position.y = 0.1 + Math.sin(performance.now() * 0.003) * 0.08;

      const dist = drop.position.distanceTo(this.playerPos);
      if (dist < 2.5) {
        // Auto-pickup!
        const type = drop.type;
        soundEngine.playMechanicalClick(0.9, 1000);
        soundEngine.playReloadSound();

        // Check if weapon is already in inventory
        let foundIndex = this.availableWeapons.findIndex(w => w.id === type);
        let activeWeapon: Weapon;

        if (foundIndex >= 0) {
          // Replenish full reserves
          this.availableWeapons[foundIndex].totalReserve = WEAPONS_DATABASE[type].totalReserve;
          this.availableWeapons[foundIndex].currentAmmo = WEAPONS_DATABASE[type].clipSize;
          activeWeapon = this.availableWeapons[foundIndex];
          this.callbacks.onGameEvent(`RESTOCKED AMMO FOR ${WEAPONS_DATABASE[type].name}!`);
        } else {
          // Add newly discovered weapon
          const newWeapon = { ...WEAPONS_DATABASE[type] };
          this.availableWeapons.push(newWeapon);
          foundIndex = this.availableWeapons.length - 1;
          activeWeapon = newWeapon;
          this.callbacks.onGameEvent(`PICKED UP GUN: ${WEAPONS_DATABASE[type].name}!`);
        }

        // Equip immediately
        this.weaponIndex = foundIndex;
        this.currentWeapon = activeWeapon;
        this.updateWeaponMesh();
        
        // Sync the unlocked weapons string
        this.stats.unlockedWeapons = this.availableWeapons.map(w => w.id).join(',');
        this.callbacks.onWeaponChange({ ...this.currentWeapon });

        // Remove drop from scene and array
        this.scene.remove(drop.mesh);
        this.gunDrops.splice(i, 1);
      }
    }
  }

  private updateOverlays(delta: number) {
    // Fade blood & acid splatters over time
    if (this.stats.bloodOnScreen > 0) {
      this.stats.bloodOnScreen = Math.max(0, this.stats.bloodOnScreen - delta * 0.35);
    }
    if (this.stats.greenAcidOnScreen > 0) {
      this.stats.greenAcidOnScreen = Math.max(0, this.stats.greenAcidOnScreen - delta * 0.4);
    }
    if (this.stats.whiteMistOnScreen > 0) {
      this.stats.whiteMistOnScreen = Math.max(0, this.stats.whiteMistOnScreen - delta * 0.5);
    }
  }

  private startSurvivalTimer() {
    this.survivalTimerInterval = window.setInterval(() => {
      this.stats.survivalSeconds++;
      if (this.stats.health < 30) {
        soundEngine.playHeartbeat();
      }
      this.callbacks.onStatsChange({ ...this.stats });
    }, 1000);
  }

  public dispose() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.survivalTimerInterval) clearInterval(this.survivalTimerInterval);

    window.removeEventListener('resize', this.onWindowResize);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('mousemove', this.onMouseMove);

    this.container.removeEventListener('touchstart', this.onTouchStart);
    this.container.removeEventListener('touchmove', this.onTouchMove);
    this.container.removeEventListener('touchend', this.onTouchEnd);

    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }

    this.gunDrops.forEach(drop => {
      this.scene.remove(drop.mesh);
    });
    this.gunDrops = [];
  }
}
