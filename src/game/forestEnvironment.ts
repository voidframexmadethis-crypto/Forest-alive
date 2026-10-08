import * as THREE from 'three';

export interface WeatherSettings {
  rainIntensity: number;
  fogDensity: number;
  windSpeed: number;
}

export class ForestEnvironmentManager {
  private scene: THREE.Scene;
  private foliageMeshes: THREE.Mesh[] = [];
  private rainParticles: THREE.Points | null = null;
  private animTime: number = 0;
  public weather: WeatherSettings = {
    rainIntensity: 0.2,
    fogDensity: 0.015,
    windSpeed: 1.0
  };

  constructor(scene: THREE.Scene, forestType: string = 'pine_dark') {
    this.scene = scene;
    this.setupEnvironmentFoliage(forestType);
    this.setupRainEffect();
  }

  private setupEnvironmentFoliage(forestType: string) {
    const isWinter = forestType === 'dead_winter';
    const isRedMist = forestType === 'red_mist';

    // Bark material
    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x2b2219,
      roughness: 0.9,
      metalness: 0.05
    });

    // Leaf / Needle materials
    const foliageMat = new THREE.MeshStandardMaterial({
      color: isRedMist ? 0x5a1818 : (isWinter ? 0x2b3846 : 0x0f3316),
      roughness: 0.75,
      wireframe: isWinter
    });

    // Mossy Rock material
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x3d4239,
      roughness: 0.85
    });

    // Create realistic trees, fallen logs & boulders
    for (let i = 0; i < 45; i++) {
      const x = (Math.random() - 0.5) * 160;
      const z = (Math.random() - 0.5) * 160;

      // Keep safehouse area clear
      if (Math.hypot(x, z - 45) < 14) continue;

      const treeGroup = new THREE.Group();

      // Trunk
      const trunkHeight = 8 + Math.random() * 6;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, trunkHeight, 8), barkMat);
      trunk.position.y = trunkHeight / 2;
      trunk.castShadow = true;
      trunk.receiveShadow = true;

      // Foliage layers
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(3.2, trunkHeight * 0.85, 8), foliageMat);
      canopy.position.y = trunkHeight * 0.7;
      canopy.castShadow = true;
      canopy.receiveShadow = true;

      treeGroup.add(trunk, canopy);
      treeGroup.position.set(x, 0, z);
      this.scene.add(treeGroup);

      this.foliageMeshes.push(canopy);
    }

    // Rocks & Fallen Logs
    for (let r = 0; r < 25; r++) {
      const rx = (Math.random() - 0.5) * 140;
      const rz = (Math.random() - 0.5) * 140;
      if (Math.hypot(rx, rz - 45) < 12) continue;

      if (r % 2 === 0) {
        // Boulder
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + Math.random() * 0.9), rockMat);
        rock.position.set(rx, 0.4, rz);
        rock.castShadow = true;
        rock.receiveShadow = true;
        this.scene.add(rock);
      } else {
        // Fallen Log
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 4.5, 8), barkMat);
        log.rotation.z = Math.PI / 2;
        log.rotation.y = Math.random() * Math.PI;
        log.position.set(rx, 0.2, rz);
        log.castShadow = true;
        log.receiveShadow = true;
        this.scene.add(log);
      }
    }
  }

  private setupRainEffect() {
    const rainCount = 800;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x88bbff,
      size: 0.15,
      transparent: true,
      opacity: 0.5
    });

    this.rainParticles = new THREE.Points(geo, mat);
    this.scene.add(this.rainParticles);
  }

  public getSurfaceTypeAtPosition(x: number, z: number): 'grass' | 'dirt' | 'wood' | 'rock' | 'water' {
    // Check if inside safehouse (wooden floor)
    if (Math.abs(x) < 7 && Math.abs(z - 45) < 6) {
      return 'wood';
    }
    // Check near river stream or puddle
    if (Math.abs(x - 20) < 4) {
      return 'water';
    }
    // Check near rocky path
    if (Math.abs(x + 15) < 3) {
      return 'rock';
    }
    // Check dirt trail to safehouse
    if (Math.abs(x) < 4 && z > 0 && z < 40) {
      return 'dirt';
    }
    // Default forest floor
    return 'grass';
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    this.animTime += delta;

    // 1. WIND SWAYING FOLIAGE
    const windAngle = Math.sin(this.animTime * this.weather.windSpeed) * 0.03;
    this.foliageMeshes.forEach((canopy) => {
      canopy.rotation.z = windAngle;
    });

    // 2. RAIN PARTICLES FOLLOWING PLAYER
    if (this.rainParticles) {
      const positions = this.rainParticles.geometry.attributes.position.array as Float32Array;
      const rainCount = positions.length / 3;

      for (let i = 0; i < rainCount; i++) {
        positions[i * 3 + 1] -= delta * 28.0; // Fall speed
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3] = playerPos.x + (Math.random() - 0.5) * 60;
          positions[i * 3 + 1] = 25 + Math.random() * 5;
          positions[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 60;
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }
  }
}
