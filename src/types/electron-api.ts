// Single source of truth for the contextBridge surface exposed in preload.js
// (preload.ts after Phase 5). The renderer reads this via the global.d.ts
// declaration on Window; the preload imports it to satisfy the contextBridge
// shape. Keep these three in lock-step:
//   - preload.js / preload.ts  (publishes electronAPI)
//   - src/global.d.ts          (augments Window)
//   - src/types/electron-api.ts (this file — the contract)

export interface ElectronAPI {
  /**
   * Returns the Flask port assigned by main.js. Synchronous so renderer code
   * can use the value at module load time without an extra await.
   */
  getPort: () => number;

  maximize: () => void;
  minimize: () => void;
  quit: () => void;
  unmaximize: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
