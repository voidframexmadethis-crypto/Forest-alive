import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as fs from 'fs';
import * as path from 'path';

// Polyfill FileReader for Node environment if needed by GLTFExporter
if (typeof global.FileReader === 'undefined') {
  global.FileReader = class FileReader {
    constructor() {
      this.result = null;
      this.onloadend = null;
      this.onerror = null;
    }
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then(buf => {
        this.result = buf;
        if (this.onloadend) this.onloadend();
      }).catch(err => {
        if (this.onerror) this.onerror(err);
      });
    }
    readAsDataURL(blob) {
      blob.arrayBuffer().then(buf => {
        const base64 = Buffer.from(buf).toString('base64');
        this.result = `data:${blob.type};base64,${base64}`;
        if (this.onloadend) this.onloadend();
      }).catch(err => {
        if (this.onerror) this.onerror(err);
      });
    }
  };
}

async function generateGLB() {
  console.log('Building 3D Test Model with Bones & Animations...');

  // Create Scene / Armature
  const group = new THREE.Group();
  group.name = 'SkinwalkerCreature';

  // Skeleton setup: Root -> Spine -> Head / Arms / Legs
  const rootBone = new THREE.Bone();
  rootBone.name = 'Root';
  rootBone.position.set(0, 0, 0);

  const spineBone = new THREE.Bone();
  spineBone.name = 'Spine';
  spineBone.position.set(0, 1.0, 0);
  rootBone.add(spineBone);

  const headBone = new THREE.Bone();
  headBone.name = 'Head';
  headBone.position.set(0, 0.8, 0);
  spineBone.add(headBone);

  const armL = new THREE.Bone();
  armL.name = 'ArmL';
  armL.position.set(-0.5, 0.6, 0);
  spineBone.add(armL);

  const armR = new THREE.Bone();
  armR.name = 'ArmR';
  armR.position.set(0.5, 0.6, 0);
  spineBone.add(armR);

  const skeleton = new THREE.Skeleton([rootBone, spineBone, headBone, armL, armR]);

  // SkinnedMesh Box Geometry
  const geometry = new THREE.BoxGeometry(0.8, 2.0, 0.6, 4, 8, 4);

  // Skin indices and weights
  const positionAttribute = geometry.attributes.position;
  const skinIndices = [];
  const skinWeights = [];

  for (let i = 0; i < positionAttribute.count; i++) {
    const y = positionAttribute.getY(i);
    if (y < -0.3) {
      skinIndices.push(0, 1, 0, 0);
      skinWeights.push(0.8, 0.2, 0, 0);
    } else if (y < 0.5) {
      skinIndices.push(1, 2, 0, 0);
      skinWeights.push(0.7, 0.3, 0, 0);
    } else {
      skinIndices.push(2, 1, 0, 0);
      skinWeights.push(0.8, 0.2, 0, 0);
    }
  }

  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

  const material = new THREE.MeshStandardMaterial({
    color: 0x8b0000,
    roughness: 0.6,
    metalness: 0.2
  });

  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.name = 'CreatureMesh';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.add(rootBone);
  mesh.bind(skeleton);

  group.add(mesh);

  // Animation Tracks
  // 1. Idle animation
  const idleTrack = new THREE.QuaternionKeyframeTrack(
    'Spine.quaternion',
    [0, 1, 2],
    [
      0, 0, 0, 1,
      0, 0.05, 0, 0.998,
      0, 0, 0, 1
    ]
  );
  const idleClip = new THREE.AnimationClip('idle', 2, [idleTrack]);

  // 2. Walk animation
  const walkTrackSpine = new THREE.QuaternionKeyframeTrack(
    'Spine.quaternion',
    [0, 0.5, 1],
    [
      0, 0, -0.05, 0.998,
      0, 0, 0.05, 0.998,
      0, 0, -0.05, 0.998
    ]
  );
  const walkTrackArmL = new THREE.QuaternionKeyframeTrack(
    'ArmL.quaternion',
    [0, 0.5, 1],
    [
      0.2, 0, 0, 0.98,
      -0.2, 0, 0, 0.98,
      0.2, 0, 0, 0.98
    ]
  );
  const walkClip = new THREE.AnimationClip('movement', 1, [walkTrackSpine, walkTrackArmL]);

  // 3. Attack animation
  const attackTrackArmR = new THREE.QuaternionKeyframeTrack(
    'ArmR.quaternion',
    [0, 0.3, 0.6],
    [
      0, 0, 0, 1,
      -0.7, 0, 0, 0.71,
      0, 0, 0, 1
    ]
  );
  const attackClip = new THREE.AnimationClip('attack', 0.6, [attackTrackArmR]);

  // 4. Death animation
  const deathTrackRoot = new THREE.VectorKeyframeTrack(
    'Root.position',
    [0, 0.8],
    [
      0, 0, 0,
      0, -0.8, 0
    ]
  );
  const deathClip = new THREE.AnimationClip('death', 0.8, [deathTrackRoot]);

  const animations = [idleClip, walkClip, attackClip, deathClip];

  const exporter = new GLTFExporter();

  return new Promise((resolve, reject) => {
    exporter.parse(
      group,
      (gltf) => {
        const outputDir = path.resolve(process.cwd(), 'public/assets/models');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        const filePath = path.join(outputDir, 'skinwalker.glb');
        const buffer = Buffer.from(gltf);
        fs.writeFileSync(filePath, buffer);
        console.log(`Successfully generated valid binary GLB file at ${filePath} (${buffer.length} bytes)`);
        resolve();
      },
      (error) => {
        console.error('Error exporting GLB:', error);
        reject(error);
      },
      { binary: true, animations: animations }
    );
  });
}

generateGLB().catch(err => {
  console.error(err);
  process.exit(1);
});
