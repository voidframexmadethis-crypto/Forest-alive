export type GameMode = 'blood_harvest' | 'death_toll' | 'creature_mode' | 'the_fast_guy';

export type ForestType = 'pine_dark' | 'red_mist' | 'dead_winter';

export type Difficulty = 'veteran' | 'realism' | 'nightmare';

export type GameState = 'menu' | 'intro_cutscene' | 'playing' | 'safehouse_rest' | 'telescope_mode' | 'tank_driving' | 'escape_cutscene' | 'game_over' | 'victory';

export type WeaponType = 
  | 'm4a1' 
  | 'shotgun' 
  | 'sniper' 
  | 'minigun' 
  | 'smoke_grenade' 
  | 'grenade' 
  | 'tank_turret' 
  | 'ak47' 
  | 'fast_guy'
  | 'dragon_gun'
  | 'whip'
  | 'underground_gun';

export type WeaponAnimState = 
  | 'idle'
  | 'walk'
  | 'run'
  | 'sprint'
  | 'turn'
  | 'stop'
  | 'aim'
  | 'lowered'
  | 'equip'
  | 'switch'
  | 'reload'
  | 'damage_reaction';

export interface Weapon {
  id: WeaponType;
  name: string;
  category: string;
  damage: number;
  fireRate: number; // ms between shots
  clipSize: number;
  currentAmmo: number;
  totalReserve: number;
  reloadTime: number; // ms
  recoil: number;
  adsZoom: number; // FOV ratio
  soundName: string;
  description: string;
}

export type CreatureType = 
  | 'zombie'
  | 'striker_zombie'
  | 'skinwalker'
  | 'double_tank'
  | 'jockey_9tentacles'
  | 'crying_witch'
  | 'cloud_creature'
  | 'flying_phantom'
  | 'blood_spider'
  | 'subterranean_snake'
  | 'winged_ice_skinwalker'
  | 'stick_skinwalker_18ft';

export type CreatureAIState = 
  | 'idle'
  | 'patrol'
  | 'wander'
  | 'listen'
  | 'investigate'
  | 'search'
  | 'stalk'
  | 'notice_player'
  | 'alert'
  | 'chase'
  | 'chasing'
  | 'fleeing'
  | 'attacking'
  | 'screaming'
  | 'stagger'
  | 'retreat'
  | 'recover'
  | 'dead';

export interface Creature {
  id: string;
  type: CreatureType;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
  state: CreatureAIState;
  aiState?: CreatureAIState;
  lastKnownPlayerPos?: { x: number; y: number; z: number } | null;
  investigateTargetPos?: { x: number; y: number; z: number } | null;
  searchTimer?: number;
  stuckTimer?: number;
  hearingRadius?: number;
  detectionLevel?: number; // 0.0 to 1.0
  staggerTimer?: number;
  stunTimer?: number;
  damageRegion?: 'left' | 'right' | 'head' | 'torso' | 'legs' | null;
  isTurtle?: boolean;
  isEnraged?: boolean; // For Witch
  tentacleAnimationPhase?: number;
  idleTimer?: number;
  mesh?: any; // Three.js Object3D reference
  visualController?: any; // CreatureVisualController reference
}

export interface DirectorState {
  tension: number; // 0 to 100
  phase: 'exploration' | 'quiet' | 'sound' | 'investigation' | 'tension' | 'discovery' | 'encounter' | 'escape' | 'panic';
  panicActive: boolean;
  quietTimer: number;
  nextSpawnCooldown: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  isSprinting: boolean;
  isBreathingHeavy: boolean;
  isFlashlightOn: boolean;
  bloodOnScreen: number; // 0 to 1 intensity
  greenAcidOnScreen: number; // 0 to 1 intensity
  whiteMistOnScreen: number; // 0 to 1 intensity
  kills: number;
  headshots: number;
  survivalSeconds: number;
  inTank: boolean;
  inJeep?: boolean;
  inAirplane?: boolean;
  inMacSuit?: boolean;
  coughedBlood: boolean;
  isCrouched: boolean;
  isProne: boolean;
  isSliding: boolean;
  isHitmarkerActive: boolean;
  skinwalkerJumpScareActive: boolean;
  iceFrozenTimer?: number;
  undergroundPullTimer?: number;
  spiderBloodDrainActive?: boolean;
  earScreamScareActive?: boolean;
  unlockedWeapons: string;
  isDebugActive?: boolean;
  directorState?: DirectorState;
}

export interface SafehouseState {
  restTimerSeconds: number;
  isRested: boolean;
  tvChannel: number;
  windowTelescopeActive: boolean;
  weaponsPrepped: boolean;
  waveCountdownSeconds: number;
}
