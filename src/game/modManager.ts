import { Weapon } from '../types/game';
import { WEAPONS_DATABASE } from './weapons';

export interface GunModConfig {
  id: string;
  name: string;
  category: string;
  damage: number;
  fireRate: number;
  clipSize: number;
  totalReserve: number;
  reloadTime: number;
  recoil: number;
  adsZoom: number;
  soundName?: string;
  description: string;
  colorHex?: string;
  laserColorHex?: string;
  isCustomMod?: boolean;
}

export interface ModPackage {
  id: string;
  name: string;
  author: string;
  version: string;
  description: string;
  dateAdded: string;
  enabled: boolean;
  guns?: GunModConfig[];
  customModelData?: string; // base64 or objectUrl for imported GLB
  customSoundData?: string; // base64 or objectUrl for imported MP3/WAV
}

// Built-in Sample Mods available for 1-click import
export const SAMPLE_MODS: ModPackage[] = [
  {
    id: 'mod_raygun_3000',
    name: 'Alien Ray Gun 3000 Mod',
    author: 'AlienLab_Mods',
    version: '1.2.0',
    description: 'Fires high-energy green plasma spheres that vaporize skinwalkers instantly with zero bullet drop!',
    dateAdded: '2026-11-04',
    enabled: true,
    guns: [
      {
        id: 'mod_raygun',
        name: 'RAY GUN 3000 (PLASMA DISINTEGRATOR)',
        category: 'Modded Energy',
        damage: 650,
        fireRate: 140,
        clipSize: 20,
        totalReserve: 200,
        reloadTime: 1500,
        recoil: 0.01,
        adsZoom: 0.7,
        soundName: 'tank_turret',
        description: 'Custom imported alien ray gun mod. Shoots green plasma bolts that disintegrate skinwalker limbs on contact!',
        colorHex: '#00ff66',
        laserColorHex: '#00ff88',
        isCustomMod: true
      }
    ]
  },
  {
    id: 'mod_gold_deagle',
    name: '24K Gold Desert Eagle Mod',
    author: 'GunsmithPro',
    version: '2.0.1',
    description: 'Heavy 50 AE hand cannon forged in solid 24K gold with extreme stopping power.',
    dateAdded: '2026-11-04',
    enabled: true,
    guns: [
      {
        id: 'mod_gold_deagle_gun',
        name: '24K GOLD DESERT EAGLE .50 AE',
        category: 'Modded Sidearm',
        damage: 420,
        fireRate: 300,
        clipSize: 7,
        totalReserve: 70,
        reloadTime: 1800,
        recoil: 0.08,
        adsZoom: 0.8,
        soundName: 'sniper',
        description: '24-Karat golden hand cannon imported mod file. One-shots basic zombies with golden headshots!',
        colorHex: '#ffd700',
        laserColorHex: '#ffaa00',
        isCustomMod: true
      }
    ]
  },
  {
    id: 'mod_cyber_laser',
    name: 'Cyberpunk Red Laser Rifle Mod',
    author: 'NeonForge_99',
    version: '1.0.0',
    description: 'High-tech futuristic assault rifle firing continuous red laser beams.',
    dateAdded: '2026-11-04',
    enabled: true,
    guns: [
      {
        id: 'mod_cyber_laser_gun',
        name: 'CYBERPUNK RED LASER BEAM RIFLE',
        category: 'Modded Energy',
        damage: 180,
        fireRate: 40, // rapid automatic beam
        clipSize: 100,
        totalReserve: 1000,
        reloadTime: 1100,
        recoil: 0.005,
        adsZoom: 0.7,
        soundName: 'minigun',
        description: 'Imported cyber laser rifle mod file. Cuts through skinwalker hordes like a hot blade through butter!',
        colorHex: '#ff0055',
        laserColorHex: '#ff0000',
        isCustomMod: true
      }
    ]
  }
];

const LOCAL_STORAGE_KEY = 'forest_alive_installed_mods';

export class ModManager {
  private static installedMods: ModPackage[] = [];

  public static init() {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        this.installedMods = JSON.parse(stored);
      } else {
        // Initialize with default sample mods
        this.installedMods = [...SAMPLE_MODS];
        this.save();
      }
    } catch (e) {
      console.warn('[ModManager] Failed to load mods from localStorage:', e);
      this.installedMods = [...SAMPLE_MODS];
    }
    this.applyModsToDatabase();
  }

  public static save() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.installedMods));
    } catch (e) {
      console.warn('[ModManager] Failed to save mods to localStorage:', e);
    }
  }

  public static getInstalledMods(): ModPackage[] {
    return this.installedMods;
  }

  public static toggleMod(modId: string) {
    const mod = this.installedMods.find(m => m.id === modId);
    if (mod) {
      mod.enabled = !mod.enabled;
      this.save();
      this.applyModsToDatabase();
    }
  }

  public static deleteMod(modId: string) {
    this.installedMods = this.installedMods.filter(m => m.id !== modId);
    this.save();
    this.applyModsToDatabase();
  }

  public static addModPackage(pkg: ModPackage) {
    // Remove existing if same ID
    this.installedMods = this.installedMods.filter(m => m.id !== pkg.id);
    this.installedMods.unshift(pkg);
    this.save();
    this.applyModsToDatabase();
  }

  // Parse imported file from user's device (Files App / Windows File Explorer)
  public static async importFile(file: File): Promise<ModPackage> {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.json')) {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // Support direct GunModConfig or ModPackage JSON formats
      if (parsed.id && parsed.name && parsed.guns) {
        const pkg: ModPackage = {
          id: parsed.id || `mod_${Date.now()}`,
          name: parsed.name,
          author: parsed.author || 'User File Import',
          version: parsed.version || '1.0.0',
          description: parsed.description || 'Imported custom mod package.',
          dateAdded: new Date().toISOString().split('T')[0],
          enabled: true,
          guns: parsed.guns
        };
        this.addModPackage(pkg);
        return pkg;
      } else if (parsed.name && parsed.damage) {
        // Single Gun Config JSON
        const gunId = parsed.id || `mod_gun_${Date.now()}`;
        const pkg: ModPackage = {
          id: `pkg_${gunId}`,
          name: `${parsed.name} Mod`,
          author: parsed.author || 'File Import',
          version: '1.0.0',
          description: parsed.description || 'Imported single gun mod configuration.',
          dateAdded: new Date().toISOString().split('T')[0],
          enabled: true,
          guns: [{
            id: gunId,
            name: parsed.name,
            category: parsed.category || 'Modded Weapon',
            damage: Number(parsed.damage) || 200,
            fireRate: Number(parsed.fireRate) || 120,
            clipSize: Number(parsed.clipSize) || 30,
            totalReserve: Number(parsed.totalReserve) || 300,
            reloadTime: Number(parsed.reloadTime) || 1500,
            recoil: Number(parsed.recoil) || 0.02,
            adsZoom: Number(parsed.adsZoom) || 0.75,
            soundName: parsed.soundName || 'm4a1',
            description: parsed.description || 'Imported custom gun file.',
            colorHex: parsed.colorHex || '#ffaa00',
            laserColorHex: parsed.laserColorHex || '#ffaa00',
            isCustomMod: true
          }]
        };
        this.addModPackage(pkg);
        return pkg;
      } else {
        throw new Error('Invalid JSON mod schema. Ensure file contains "name" and "guns" or weapon parameters.');
      }
    } else if (fileName.endsWith('.glb') || fileName.endsWith('.gltf')) {
      // 3D Model File Import (GLB/GLTF)
      const objectUrl = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
      const gunId = `mod_3d_${Date.now()}`;

      const pkg: ModPackage = {
        id: `pkg_3d_${gunId}`,
        name: `3D Model Gun: ${cleanName}`,
        author: '3D File Import',
        version: '1.0.0',
        description: `Imported 3D model mod file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        dateAdded: new Date().toISOString().split('T')[0],
        enabled: true,
        customModelData: objectUrl,
        guns: [{
          id: gunId,
          name: `3D MOD: ${cleanName}`,
          category: 'Imported 3D Weapon',
          damage: 550,
          fireRate: 110,
          clipSize: 45,
          totalReserve: 450,
          reloadTime: 1600,
          recoil: 0.02,
          adsZoom: 0.75,
          soundName: 'm4a1',
          description: `Custom imported 3D mesh file (${file.name}). Deploys custom model geometry into tactical combat!`,
          colorHex: '#00ccff',
          isCustomMod: true
        }]
      };
      this.addModPackage(pkg);
      return pkg;
    } else if (fileName.endsWith('.mp3') || fileName.endsWith('.wav')) {
      // Custom Sound Audio File Import
      const objectUrl = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
      const gunId = `mod_audio_${Date.now()}`;

      const pkg: ModPackage = {
        id: `pkg_audio_${gunId}`,
        name: `Audio Sound Gun: ${cleanName}`,
        author: 'Audio File Import',
        version: '1.0.0',
        description: `Imported audio gunshot sound mod: ${file.name}`,
        dateAdded: new Date().toISOString().split('T')[0],
        enabled: true,
        customSoundData: objectUrl,
        guns: [{
          id: gunId,
          name: `AUDIO MOD: ${cleanName} CANNON`,
          category: 'Imported Sound Weapon',
          damage: 480,
          fireRate: 130,
          clipSize: 30,
          totalReserve: 300,
          reloadTime: 1800,
          recoil: 0.03,
          adsZoom: 0.75,
          soundName: 'm4a1',
          description: `Custom audio sound mod file (${file.name}). Uses imported gunshot audio effects in combat!`,
          colorHex: '#ff00ff',
          isCustomMod: true
        }]
      };
      this.addModPackage(pkg);
      return pkg;
    } else {
      throw new Error('Unsupported file extension. Please select a .json, .glb, .gltf, .mp3, or .wav file.');
    }
  }

  // Inject enabled gun mods into the global WEAPONS_DATABASE
  public static applyModsToDatabase() {
    this.installedMods.forEach((pkg) => {
      if (pkg.enabled && pkg.guns) {
        pkg.guns.forEach((g) => {
          (WEAPONS_DATABASE as any)[g.id] = {
            id: g.id as any,
            name: g.name,
            category: g.category,
            damage: g.damage,
            fireRate: g.fireRate,
            clipSize: g.clipSize,
            currentAmmo: g.clipSize,
            totalReserve: g.totalReserve,
            reloadTime: g.reloadTime,
            recoil: g.recoil,
            adsZoom: g.adsZoom,
            soundName: g.soundName || 'm4a1',
            description: g.description,
            colorHex: g.colorHex,
            laserColorHex: g.laserColorHex,
            isCustomMod: true
          };
        });
      }
    });
  }

  // Get active mod weapons array for player loadouts
  public static getActiveModWeapons(): Weapon[] {
    const list: Weapon[] = [];
    this.installedMods.forEach((pkg) => {
      if (pkg.enabled && pkg.guns) {
        pkg.guns.forEach((g) => {
          list.push({
            id: g.id as any,
            name: g.name,
            category: g.category,
            damage: g.damage,
            fireRate: g.fireRate,
            clipSize: g.clipSize,
            currentAmmo: g.clipSize,
            totalReserve: g.totalReserve,
            reloadTime: g.reloadTime,
            recoil: g.recoil,
            adsZoom: g.adsZoom,
            soundName: g.soundName || 'm4a1',
            description: g.description,
            colorHex: g.colorHex,
            laserColorHex: g.laserColorHex,
            isCustomMod: true
          } as any);
        });
      }
    });
    return list;
  }

  // Export mod package to a downloadable JSON file for sharing
  public static exportModToJSON(pkg: ModPackage) {
    const jsonStr = JSON.stringify(pkg, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pkg.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_mod.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Initialize on load
ModManager.init();
