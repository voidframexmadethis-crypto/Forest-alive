import * as THREE from 'three';
import { MaterialProfileManager } from './assets/MaterialProfiles';

export type HumanCharacterId = 'titan' | 'katrina' | 'natasha' | 'bill' | 'luis' | 'lewis';

export interface CharacterMeshParts {
  group: THREE.Group;
  head: THREE.Mesh;
  chest: THREE.Mesh;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  handL: THREE.Mesh;
  handR: THREE.Mesh;
  feetL: THREE.Mesh;
  feetR: THREE.Mesh;
  eyes: THREE.Group;
  hair: THREE.Mesh;
  jacketOrSweater: THREE.Mesh;
}

export class CharacterMeshBuilder {
  public static createHumanCharacter(rawId: HumanCharacterId, isPregnant: boolean = false): CharacterMeshParts {
    const id = rawId === 'lewis' ? 'luis' : rawId;
    const group = new THREE.Group();
    group.name = `Human_${id}`;

    // Standard materials
    let skinColor = 0xd2997a;
    if (id === 'katrina') skinColor = 0xe0a98b;
    else if (id === 'natasha') skinColor = 0xf0c2a8;
    else if (id === 'bill') skinColor = 0xc88f72;
    else if (id === 'luis') skinColor = 0xc68a68;

    const skinMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.65,
      metalness: 0.05
    });

    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xf5f5f5 });
    let irisColor = 0x2b4a6f;
    if (id === 'katrina') irisColor = 0x2e6f40;
    else if (id === 'natasha') irisColor = 0x10b981; // Emerald green
    else if (id === 'bill') irisColor = 0x475569;
    else if (id === 'luis') irisColor = 0x78350f;

    const eyeIrisMat = new THREE.MeshBasicMaterial({ color: irisColor });

    let hairMat: THREE.MeshStandardMaterial;
    let clothingTopMat: THREE.MeshStandardMaterial;
    let clothingPantsMat: THREE.MeshStandardMaterial;
    let bootsMat: THREE.MeshStandardMaterial;

    if (id === 'katrina') {
      // Katrina: Red sweater, white shirt collar underneath, black pants, brown boots
      hairMat = new THREE.MeshStandardMaterial({ color: 0x4a2311, roughness: 0.8 }); // Ponytail brown
      clothingTopMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.85 }); // Red sweater
      clothingPantsMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.9 }); // Dark black pants
      bootsMat = new THREE.MeshStandardMaterial({ color: 0x3b2416, roughness: 0.7 }); // Brown boots
    } else if (id === 'natasha') {
      // Natasha: Elegant mountain estate heiress - dark violet tactical coat, gold trim, blonde bun, dark leggings
      hairMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.65 }); // Golden blonde
      clothingTopMat = new THREE.MeshStandardMaterial({ color: 0x3b1d54, roughness: 0.75 }); // Royal violet coat
      clothingPantsMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 }); // Fitted dark tactical trousers
      bootsMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.5 }); // Polished dark boots
    } else if (id === 'bill') {
      // Bill Lewis: Olive field jacket, hunter cap, cargo trousers, salt & pepper hair
      hairMat = new THREE.MeshStandardMaterial({ color: 0x737373, roughness: 0.9 }); // Salt & pepper gray
      clothingTopMat = new THREE.MeshStandardMaterial({ color: 0x3f4e35, roughness: 0.85 }); // Olive field jacket
      clothingPantsMat = new THREE.MeshStandardMaterial({ color: 0x363025, roughness: 0.9 }); // Cargo trousers
      bootsMat = new THREE.MeshStandardMaterial({ color: 0x1f1915, roughness: 0.7 });
    } else if (id === 'luis') {
      // Luis: Flannel canvas welder jacket, work jeans, steel-toe boots
      hairMat = new THREE.MeshStandardMaterial({ color: 0x1f1915, roughness: 0.85 });
      clothingTopMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }); // Flannel canvas jacket
      clothingPantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 }); // Denim jeans
      bootsMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.65 });
    } else {
      // Titan (Default Main Protagonist): Tactical operative vest, black combat shirt, camo pants
      hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 });
      clothingTopMat = new THREE.MeshStandardMaterial({ color: 0x262626, roughness: 0.75 }); // Tactical vest
      clothingPantsMat = new THREE.MeshStandardMaterial({ color: 0x2d3728, roughness: 0.85 }); // Camo cargo
      bootsMat = new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.6 }); // Tactical combat boots
    }

    // --- 1. HEAD & FACE ---
    const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
    headGeo.scale(1.0, 1.25, 1.05); // Human head proportions
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.62;
    head.castShadow = true;

    // Eyes
    const eyes = new THREE.Group();
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeWhiteMat);
    const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), eyeIrisMat);
    pupilL.position.z = 0.02;
    eyeL.add(pupilL);
    eyeL.position.set(-0.065, 0.03, 0.15);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeWhiteMat);
    const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), eyeIrisMat);
    pupilR.position.z = 0.02;
    eyeR.add(pupilR);
    eyeR.position.set(0.065, 0.03, 0.15);

    eyes.add(eyeL, eyeR);
    head.add(eyes);

    // Hair
    const hairGeo = new THREE.SphereGeometry(0.19, 14, 14);
    hairGeo.scale(1.02, 1.1, 1.08);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.06, -0.02);
    head.add(hair);

    if (id === 'katrina') {
      // Katrina: Add crisp white shirt collar underneath red sweater
      const collarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.08, 12), collarMat);
      collar.position.y = 1.45;
      group.add(collar);

      // Katrina: Ponytail extension behind head
      const ponytail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.25, 8), hairMat);
      ponytail.rotation.x = -0.5;
      ponytail.position.set(0, 0.02, -0.22);
      head.add(ponytail);
    } else if (id === 'natasha') {
      // Natasha: Braided blonde hair bun + silver collar trim
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), hairMat);
      bun.position.set(0, 0.12, -0.16);
      head.add(bun);

      const silverTrimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.3 });
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.06, 12), silverTrimMat);
      collar.position.y = 1.46;
      group.add(collar);
    } else if (id === 'bill') {
      // Bill: Hunter cap visor on forehead
      const capMat = new THREE.MeshStandardMaterial({ color: 0x2b3824, roughness: 0.8 });
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.025, 0.12), capMat);
      visor.position.set(0, 0.16, 0.16);
      visor.rotation.x = 0.1;
      head.add(visor);
    } else if (id === 'luis') {
      // Luis: Welding goggles on forehead
      const gogglesMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 });
      const lensMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const goggleL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10), gogglesMat);
      goggleL.rotation.x = Math.PI / 2;
      goggleL.position.set(-0.07, 0.15, 0.15);
      const lensL = new THREE.Mesh(new THREE.CircleGeometry(0.03, 8), lensMat);
      lensL.position.set(0, 0, 0.02);
      goggleL.add(lensL);

      const goggleR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10), gogglesMat);
      goggleR.rotation.x = Math.PI / 2;
      goggleR.position.set(0.07, 0.15, 0.15);
      const lensR = new THREE.Mesh(new THREE.CircleGeometry(0.03, 8), lensMat);
      lensR.position.set(0, 0, 0.02);
      goggleR.add(lensR);

      head.add(goggleL, goggleR);
    }

    // --- 2. TORSO / CHEST ---
    const chestWidth = id === 'katrina' ? 0.38 : 0.46;
    const chestGeo = new THREE.BoxGeometry(chestWidth, 0.55, 0.26);
    const jacketOrSweater = new THREE.Mesh(chestGeo, clothingTopMat);
    jacketOrSweater.position.y = 1.25;
    jacketOrSweater.castShadow = true;
    jacketOrSweater.receiveShadow = true;

    // Katrina: Add pregnant belly bulge
    if (id === 'katrina' && isPregnant) {
      const bellyMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.65 });
      const belly = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), bellyMat);
      belly.position.set(0, 1.2, 0.18);
      belly.scale.z = 0.8;
      jacketOrSweater.add(belly);
    }

    // Belt / Waist
    const waistMat = new THREE.MeshStandardMaterial({ color: 0x1f1915 });
    const waist = new THREE.Mesh(new THREE.BoxGeometry(chestWidth * 0.95, 0.1, 0.24), waistMat);
    waist.position.y = 0.92;
    group.add(waist);

    // --- 3. ARMS & HANDS WITH FINGERS ---
    const buildArm = (isLeft: boolean) => {
      const armGroup = new THREE.Group();
      const xSign = isLeft ? -1 : 1;

      // Upper arm
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.32, 10), clothingTopMat);
      upperArm.position.y = -0.16;
      upperArm.castShadow = true;

      // Lower arm / forearm
      const lowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.3, 10), skinMat);
      lowerArm.position.y = -0.45;
      lowerArm.castShadow = true;

      // Hand with 5 articulated fingers
      const handGroup = new THREE.Group();
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.03), skinMat);
      palm.position.y = -0.04;
      handGroup.add(palm);

      // Fingers
      for (let f = 0; f < 4; f++) {
        const finger = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.06, 0.016), skinMat);
        finger.position.set(-0.03 + f * 0.02, -0.11, 0);
        handGroup.add(finger);
      }
      // Thumb
      const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.05, 0.018), skinMat);
      thumb.position.set(xSign * 0.045, -0.06, 0.02);
      thumb.rotation.z = xSign * -0.4;
      handGroup.add(thumb);

      handGroup.position.y = -0.62;

      armGroup.add(upperArm, lowerArm, handGroup);
      armGroup.position.set(xSign * (chestWidth / 2 + 0.06), 1.48, 0);
      return { armGroup, handMesh: palm };
    };

    const leftArmData = buildArm(true);
    const rightArmData = buildArm(false);

    const armL = leftArmData.armGroup;
    const armR = rightArmData.armGroup;
    const handL = leftArmData.handMesh;
    const handR = rightArmData.handMesh;

    // --- 4. LEGS, FEET & BOOTS ---
    const buildLeg = (isLeft: boolean) => {
      const legGroup = new THREE.Group();
      const xSign = isLeft ? -1 : 1;

      // Thigh
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.42, 10), clothingPantsMat);
      thigh.position.y = -0.21;
      thigh.castShadow = true;

      // Shin
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.4, 10), clothingPantsMat);
      shin.position.y = -0.62;
      shin.castShadow = true;

      // Foot / Boot
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.22), bootsMat);
      boot.position.set(0, -0.88, 0.05);
      boot.castShadow = true;

      legGroup.add(thigh, shin, boot);
      legGroup.position.set(xSign * 0.13, 0.88, 0);
      return { legGroup, feetMesh: boot };
    };

    const leftLegData = buildLeg(true);
    const rightLegData = buildLeg(false);

    const legL = leftLegData.legGroup;
    const legR = rightLegData.legGroup;
    const feetL = leftLegData.feetMesh;
    const feetR = rightLegData.feetMesh;

    group.add(head, jacketOrSweater, armL, armR, legL, legR);

    return {
      group,
      head,
      chest: jacketOrSweater,
      armL,
      armR,
      legL,
      legR,
      handL,
      handR,
      feetL,
      feetR,
      eyes,
      hair,
      jacketOrSweater
    };
  }
}
