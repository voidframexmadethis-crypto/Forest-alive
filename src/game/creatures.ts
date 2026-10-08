import { CreatureType } from '../types/game';

export interface CreatureConfig {
  type: CreatureType;
  name: string;
  maxHealth: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  description: string;
  eyeColor: number; // Hex color for emissive eyes
}

export const CREATURE_CONFIGS: Record<CreatureType, CreatureConfig> = {
  zombie: {
    type: 'zombie',
    name: 'Shambling Corpse',
    maxHealth: 80,
    speed: 1.8,
    damage: 0.12, // Sloth-pace damage (~3 hours total survival time for 18 hearts)
    attackRange: 2.0,
    attackCooldown: 2800,
    description: 'Basic undead corpse wandering the woods.',
    eyeColor: 0xff3300
  },
  striker_zombie: {
    type: 'striker_zombie',
    name: 'Striker Zombie',
    maxHealth: 110,
    speed: 4.2,
    damage: 0.18,
    attackRange: 2.2,
    attackCooldown: 2500,
    description: 'Fast sprinter aiming to destroy safehouse defenses & farms.',
    eyeColor: 0xffaa00
  },
  skinwalker: {
    type: 'skinwalker',
    name: 'Skinwalker Stalker',
    maxHealth: 160,
    speed: 5.0,
    damage: 0.22,
    attackRange: 2.5,
    attackCooldown: 2800,
    description: 'Shape-shifting forest nightmare. Extremely agile with leaping strike.',
    eyeColor: 0xff00ff
  },
  double_tank: {
    type: 'double_tank',
    name: 'Double Tank Brute',
    maxHealth: 750,
    speed: 2.5,
    damage: 0.35,
    attackRange: 3.2,
    attackCooldown: 3500,
    description: 'Massive two-headed, four-armed musclebound zombie. Punches shake screen & make player cough blood.',
    eyeColor: 0xff0000
  },
  jockey_9tentacles: {
    type: 'jockey_9tentacles',
    name: '9-Tentacle Jockey',
    maxHealth: 260,
    speed: 3.8,
    damage: 0.20,
    attackRange: 2.8,
    attackCooldown: 3000,
    description: 'Nine-tentacled freak that hugs player face and spits toxic green acid liquid.',
    eyeColor: 0x00ff44
  },
  crying_witch: {
    type: 'crying_witch',
    name: 'Crying Witch',
    maxHealth: 380,
    speed: 6.5, // Enraged speed
    damage: 0.40,
    attackRange: 2.0,
    attackCooldown: 2800,
    description: 'Hides crying in dark woods. Extremely dangerous if startled by FLASHLIGHT beam!',
    eyeColor: 0xff0044
  },
  cloud_creature: {
    type: 'cloud_creature',
    name: 'Cloud Creature Entity',
    maxHealth: 220,
    speed: 2.2,
    damage: 0.15,
    attackRange: 12.0,
    attackCooldown: 4000,
    description: 'Airborne foggy entity floating high above, raining white acidic cloud drops.',
    eyeColor: 0xffffff
  },
  flying_phantom: {
    type: 'flying_phantom',
    name: 'Flying Phantom Gargoyle',
    maxHealth: 180,
    speed: 5.5,
    damage: 0.22,
    attackRange: 2.5,
    attackCooldown: 3000,
    description: 'Screeching winged demon dive-bombing from the night sky.',
    eyeColor: 0x00ffff
  },
  blood_spider: {
    type: 'blood_spider',
    name: 'Giant Blood Spider',
    maxHealth: 140,
    speed: 6.0,
    damage: 0.25,
    attackRange: 2.5,
    attackCooldown: 2500,
    description: 'Jumps directly onto your chest and face, latching on to suck your blood!',
    eyeColor: 0xff0000
  },
  subterranean_snake: {
    type: 'subterranean_snake',
    name: 'Subterranean Pit Snake',
    maxHealth: 210,
    speed: 4.5,
    damage: 0.28,
    attackRange: 3.0,
    attackCooldown: 2800,
    description: 'Burrows underneath the soil and strikes from below, pulling you into the earth!',
    eyeColor: 0x33ff33
  },
  winged_ice_skinwalker: {
    type: 'winged_ice_skinwalker',
    name: 'Winged Frost Skinwalker',
    maxHealth: 290,
    speed: 5.8,
    damage: 0.20,
    attackRange: 10.0,
    attackCooldown: 3200,
    description: 'Winged pale nightmare emitting freezing white ice mist that locks you in place!',
    eyeColor: 0x88eeff
  },
  stick_skinwalker_18ft: {
    type: 'stick_skinwalker_18ft',
    name: '18ft Stick Skinwalker',
    maxHealth: 520,
    speed: 6.8,
    damage: 0.35,
    attackRange: 4.5,
    attackCooldown: 3500,
    description: '18-foot tall skeletal stick beast with inverted backward limbs that screams directly into your ear!',
    eyeColor: 0xffe066
  }
};
