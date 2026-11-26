// Shared procedural materials. Brass is fully metallic with roughness varied
// by painted wear, never glossy.

import * as THREE from "three";
import { canvasTexture, paintWear } from "../engrave";

let wear: THREE.Texture | null = null;

/** One tiling wear map shared by every brass part. */
export function wearMap() {
  wear ??= canvasTexture(paintWear(512, 11), { repeat: 3 });
  return wear;
}

export function brass(color = "#b08d57", roughness = 1) {
  return new THREE.MeshStandardMaterial({ color, metalness: 1, roughness, roughnessMap: wearMap() });
}
