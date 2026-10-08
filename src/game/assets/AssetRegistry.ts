import { MaterialProfileType } from './MaterialProfiles';

export interface CreatureAssetConfig {
  id: string;
  name: string;
  modelPath?: string;
  fallbackType: string;
  scale: { x: number; y: number; z: number };
  positionOffset: { x: number; y: number; z: number };
  rotationOffset: { x: number; y: number; z: number };
  materialProfile: MaterialProfileType;
  shadows: { cast: boolean; receive: boolean };
  lod: { highDist: number; medDist: number; farDist: number };
  animations: {
    idle: string;
    walk: string;
    run: string;
    attack: string;
    hit: string;
    stagger: string;
    death: string;
  };
}

export interface WeaponAssetConfig {
  id: string;
  name: string;
  modelPath?: string;
  category: string;
  scale: { x: number; y: number; z: number };
  positionOffset: { x: number; y: number; z: number };
  rotationOffset: { x: number; y: number; z: number };
  materialProfile: MaterialProfileType;
  sockets: {
    weapon: { x: number; y: number; z: number };
    dominantHand: { x: number; y: number; z: number };
    supportHand: { x: number; y: number; z: number };
    magazine: { x: number; y: number; z: number };
    muzzle: { x: number; y: number; z: number };
    sights: { x: number; y: number; z: number };
  };
  reloadSequence: string[];
}

export interface EnvironmentAssetConfig {
  id: string;
  name: string;
  category: 'tree' | 'rock' | 'building' | 'prop' | 'vehicle' | 'sign';
  modelPath: string;
  scale: { x: number; y: number; z: number };
  materialProfile: MaterialProfileType;
  lodDistance: number;
}

export const CREATURE_ASSET_REGISTRY: Record<string, CreatureAssetConfig> = {
  skinwalker: {
    id: 'skinwalker',
    name: 'Skinwalker Stalker',
    modelPath: '/assets/creatures/skinwalker.glb',
    fallbackType: 'skinwalker',
    scale: { x: 1.0, y: 1.0, z: 1.0 },
    positionOffset: { x: 0, y: 0, z: 0 },
    rotationOffset: { x: 0, y: 0, z: 0 },
    materialProfile: 'SKIN',
    shadows: { cast: true, receive: true },
    lod: { highDist: 25, medDist: 60, farDist: 100 },
    animations: {
      idle: 'idle',
      walk: 'movement',
      run: 'movement',
      attack: 'attack',
      hit: 'damage',
      stagger: 'damage',
      death: 'death'
    }
  },
  zombie: {
    id: 'zombie',
    name: 'Shambling Corpse',
    fallbackType: 'zombie',
    scale: { x: 1.0, y: 1.0, z: 1.0 },
    positionOffset: { x: 0, y: 0, z: 0 },
    rotationOffset: { x: 0, y: 0, z: 0 },
    materialProfile: 'SKIN',
    shadows: { cast: true, receive: true },
    lod: { highDist: 25, medDist: 60, farDist: 100 },
    animations: {
      idle: 'idle',
      walk: 'walk',
      run: 'run',
      attack: 'attack',
      hit: 'hit',
      stagger: 'stagger',
      death: 'death'
    }
  },
  striker_zombie: {
    id: 'striker_zombie',
    name: 'Striker Zombie',
    fallbackType: 'striker_zombie',
    scale: { x: 1.0, y: 1.0, z: 1.0 },
    positionOffset: { x: 0, y: 0, z: 0 },
    rotationOffset: { x: 0, y: 0, z: 0 },
    materialProfile: 'SKIN',
    shadows: { cast: true, receive: true },
    lod: { highDist: 25, medDist: 60, farDist: 100 },
    animations: {
      idle: 'idle',
      walk: 'run',
      run: 'sprint',
      attack: 'attack',
      hit: 'hit',
      stagger: 'stagger',
      death: 'death'
    }
  },
  double_tank: {
    id: 'double_tank',
    name: 'Double Tank Brute',
    fallbackType: 'double_tank',
    scale: { x: 1.4, y: 1.4, z: 1.4 },
    positionOffset: { x: 0, y: 0, z: 0 },
    rotationOffset: { x: 0, y: 0, z: 0 },
    materialProfile: 'MUD',
    shadows: { cast: true, receive: true },
    lod: { highDist: 30, medDist: 70, farDist: 120 },
    animations: {
      idle: 'idle',
      walk: 'walk',
      run: 'charge',
      attack: 'smash',
      hit: 'hit',
      stagger: 'stagger',
      death: 'death'
    }
  },
  jockey_9tentacles: {
    id: 'jockey_9tentacles',
    name: '9-Tentacle Jockey',
    fallbackType: 'jockey_9tentacles',
    scale: { x: 1.0, y: 1.0, z: 1.0 },
    positionOffset: { x: 0, y: 0, z: 0 },
    rotationOffset: { x: 0, y: 0, z: 0 },
    materialProfile: 'WET_SURFACE',
    shadows: { cast: true, receive: true },
    lod: { highDist: 20, medDist: 50, farDist: 90 },
    animations: {
      idle: 'idle',
      walk: 'crawl',
      run: 'leap',
      attack: 'spit',
      hit: 'hit',
      stagger: 'stagger',
      death: 'death'
    }
  },
  crying_witch: {
    id: 'crying_witch',
    name: 'Crying Witch',
    fallbackType: 'crying_witch',
    scale: { x: 0.9, y: 0.9, z: 0.9 },
    positionOffset: { x: 0, y: 0, z: 0 },
    rotationOffset: { x: 0, y: 0, z: 0 },
    materialProfile: 'CLOTH',
    shadows: { cast: true, receive: true },
    lod: { highDist: 25, medDist: 60, farDist: 100 },
    animations: {
      idle: 'crying',
      walk: 'stalk',
      run: 'scream_sprint',
      attack: 'claw',
      hit: 'hit',
      stagger: 'stagger',
      death: 'death'
    }
  },
  cloud_creature: {
    id: 'cloud_creature',
    name: 'Cloud Creature Entity',
    fallbackType: 'cloud_creature',
    scale: { x: 1.5, y: 1.5, z: 1.5 },
    positionOffset: { x: 0, y: 0, z: 0 },
    rotationOffset: { x: 0, y: 0, z: 0 },
    materialProfile: 'WET_SURFACE',
    shadows: { cast: false, receive: false },
    lod: { highDist: 40, medDist: 80, farDist: 150 },
    animations: {
      idle: 'float',
      walk: 'drift',
      run: 'storm',
      attack: 'acid_rain',
      hit: 'pulse',
      stagger: 'pulse',
      death: 'dissipate'
    }
  },
  flying_phantom: {
    id: 'flying_phantom',
    name: 'Flying Phantom Gargoyle',
    fallbackType: 'flying_phantom',
    scale: { x: 1.1, y: 1.1, z: 1.1 },
    positionOffset: { x: 0, y: 0, z: 0 },
    rotationOffset: { x: 0, y: 0, z: 0 },
    materialProfile: 'BONE',
    shadows: { cast: true, receive: true },
    lod: { highDist: 35, medDist: 75, farDist: 130 },
    animations: {
      idle: 'soar',
      walk: 'fly',
      run: 'dive',
      attack: 'swoop_claw',
      hit: 'hit',
      stagger: 'stagger',
      death: 'fall_death'
    }
  }
};

export const WEAPON_ASSET_REGISTRY: Record<string, WeaponAssetConfig> = {
  m4a1: {
    id: 'm4a1',
    name: 'M4A1 Tactical Carbine',
    category: 'Assault Rifle',
    scale: { x: 1.0, y: 1.0, z: 1.0 },
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
    reloadSequence: [
      'lower_weapon',
      'hand_reach_mag',
      'release_mag',
      'eject_mag',
      'retrieve_fresh_mag',
      'insert_mag',
      'rack_bolt',
      'ready_weapon'
    ]
  },
  ak47: {
    id: 'ak47',
    name: 'AK-47 Soviet Relic',
    category: 'Heavy Assault Rifle',
    scale: { x: 1.0, y: 1.0, z: 1.0 },
    positionOffset: { x: 0.22, y: -0.2, z: -0.45 },
    rotationOffset: { x: 0, y: 0, z: 0 },
    materialProfile: 'WOOD',
    sockets: {
      weapon: { x: 0, y: 0, z: 0 },
      dominantHand: { x: 0, y: -0.05, z: 0.12 },
      supportHand: { x: 0, y: -0.02, z: -0.2 },
      magazine: { x: 0, y: -0.15, z: -0.1 },
      muzzle: { x: 0, y: 0.02, z: -0.55 },
      sights: { x: 0, y: 0.06, z: -0.1 }
    },
    reloadSequence: [
      'lower_weapon',
      'hand_reach_mag',
      'knock_mag_release',
      'eject_mag',
      'retrieve_fresh_mag',
      'rock_mag_in',
      'charge_handle',
      'ready_weapon'
    ]
  },
  shotgun: {
    id: 'shotgun',
    name: 'Remington 870 Express',
    category: 'Combat Shotgun',
    scale: { x: 1.0, y: 1.0, z: 1.0 },
    positionOffset: { x: 0.24, y: -0.22, z: -0.48 },
    rotationOffset: { x: 0, y: 0, z: 0 },
    materialProfile: 'METAL',
    sockets: {
      weapon: { x: 0, y: 0, z: 0 },
      dominantHand: { x: 0, y: -0.05, z: 0.15 },
      supportHand: { x: 0, y: 0.01, z: -0.35 },
      magazine: { x: 0, y: -0.08, z: -0.2 },
      muzzle: { x: 0, y: 0.03, z: -0.6 },
      sights: { x: 0, y: 0.05, z: -0.1 }
    },
    reloadSequence: [
      'lower_weapon',
      'retrieve_shell',
      'insert_shell_tube',
      'pump_action',
      'ready_weapon'
    ]
  },
  sniper: {
    id: 'sniper',
    name: 'Barrett .50 BMG Anti-Material',
    category: 'Sniper Rifle',
    scale: { x: 1.0, y: 1.0, z: 1.0 },
    positionOffset: { x: 0.25, y: -0.22, z: -0.5 },
    rotationOffset: { x: 0, y: 0, z: 0 },
    materialProfile: 'METAL',
    sockets: {
      weapon: { x: 0, y: 0, z: 0 },
      dominantHand: { x: 0, y: -0.05, z: 0.2 },
      supportHand: { x: 0, y: -0.02, z: -0.3 },
      magazine: { x: 0, y: -0.15, z: -0.1 },
      muzzle: { x: 0, y: 0.03, z: -0.8 },
      sights: { x: 0, y: 0.11, z: -0.2 }
    },
    reloadSequence: [
      'lower_weapon',
      'pull_heavy_mag',
      'insert_heavy_mag',
      'pull_bolt_handle',
      'ready_weapon'
    ]
  },
  minigun: {
    id: 'minigun',
    name: 'M134 Rotary Vulcan',
    category: 'Heavy Support',
    scale: { x: 1.0, y: 1.0, z: 1.0 },
    positionOffset: { x: 0.28, y: -0.25, z: -0.45 },
    rotationOffset: { x: 0, y: 0, z: 0 },
    materialProfile: 'METAL',
    sockets: {
      weapon: { x: 0, y: 0, z: 0 },
      dominantHand: { x: 0, y: 0.1, z: 0.1 },
      supportHand: { x: 0, y: 0.15, z: -0.2 },
      magazine: { x: 0.15, y: -0.1, z: 0 },
      muzzle: { x: 0, y: 0, z: -0.6 },
      sights: { x: 0, y: 0.12, z: -0.1 }
    },
    reloadSequence: [
      'lower_heavy_weapon',
      'swap_ammo_can',
      'feed_bullet_belt',
      'ready_weapon'
    ]
  },
  smoke_grenade: {
    id: 'smoke_grenade',
    name: 'Allergic Anti-Monster Smoke Grenade',
    category: 'Throwable',
    scale: { x: 1.0, y: 1.0, z: 1.0 },
    positionOffset: { x: 0.2, y: -0.15, z: -0.35 },
    rotationOffset: { x: 0, y: 0, z: 0 },
    materialProfile: 'METAL',
    sockets: {
      weapon: { x: 0, y: 0, z: 0 },
      dominantHand: { x: 0, y: 0, z: 0 },
      supportHand: { x: 0, y: 0, z: 0 },
      magazine: { x: 0, y: 0, z: 0 },
      muzzle: { x: 0, y: 0, z: 0 },
      sights: { x: 0, y: 0, z: 0 }
    },
    reloadSequence: ['retrieve_canister', 'ready_weapon']
  },
  grenade: {
    id: 'grenade',
    name: 'M67 Frag Grenade',
    category: 'Throwable',
    scale: { x: 1.0, y: 1.0, z: 1.0 },
    positionOffset: { x: 0.2, y: -0.15, z: -0.35 },
    rotationOffset: { x: 0, y: 0, z: 0 },
    materialProfile: 'METAL',
    sockets: {
      weapon: { x: 0, y: 0, z: 0 },
      dominantHand: { x: 0, y: 0, z: 0 },
      supportHand: { x: 0, y: 0, z: 0 },
      magazine: { x: 0, y: 0, z: 0 },
      muzzle: { x: 0, y: 0, z: 0 },
      sights: { x: 0, y: 0, z: 0 }
    },
    reloadSequence: ['retrieve_grenade', 'ready_weapon']
  }
};
