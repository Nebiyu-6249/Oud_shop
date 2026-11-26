// Shared stage state between the persistent canvas and the routes. Progress
// changes every scroll frame, so the canvas reads it transiently (getState and
// subscribe) rather than through React renders.

import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import type { BeatLabel } from "./sequence";

export type StageMode =
  /** The home page: progress follows the scroll. */
  | "scroll"
  /** Any other route: the camera travels to a label and parks there. */
  | "parked"
  /** The finder draws its own instrument; the stage pauses out of sight. */
  | "hidden";

export type StageState = {
  progress: number;
  mode: StageMode;
  /** Where a parked route wants the camera. */
  target: BeatLabel;
  /** 3 full, 2 no tilt-shift, 1 no dust, 0 no shadows. */
  quality: 0 | 1 | 2 | 3;
  reduced: boolean;
  debug: boolean;
  /** The runtime chunk has loaded and the first frame is on screen. */
  ready: boolean;
  /** The visitor has interacted; ambient motion (smoke, dust) may run. */
  live: boolean;
  /** Reduced motion: the stage is briefly faded out while it cuts to a new frame. */
  dip: boolean;
};

export const stageStore = createStore<StageState>()(() => ({
  progress: 0,
  mode: "hidden",
  target: "ascent",
  quality: 3,
  reduced: false,
  debug: false,
  ready: false,
  live: false,
  dip: false,
}));

export const useStage = <T,>(selector: (s: StageState) => T) => useStore(stageStore, selector);
