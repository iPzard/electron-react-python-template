import {
  spawn,
  spawnSync,
  type ChildProcess,
  type SpawnOptions,
  type SpawnSyncOptions
} from 'child_process';
import * as http from 'http';
import * as readline from 'readline';
// get-port v5 publishes via `export = getPort` (CommonJS namespace),
// which works as a default import under esModuleInterop.
import getPort from 'get-port';

/**
 * Patterns for known-noisy Electron stderr lines that are harmless and
 * cannot be silenced upstream. Lines matching any pattern are dropped;
 * everything else is forwarded so real errors stay visible.
 *
 * - Autofill.enable: Chromium's DevTools front-end calls Autofill.enable
 *   on open, but Electron's bundled Chromium does not implement the
 *   Autofill protocol domain. The error fires every time DevTools opens
 *   in dev mode and is purely cosmetic. Tracked upstream in Electron.
 *
 * - ExtensionLoadWarning ("Permission … is unknown or URL pattern is
 *   malformed"): Chromium extensions installed via electron-devtools-
 *   installer (React/Redux DevTools) declare permissions like
 *   `notifications` and `contextMenus` that Electron's bundled Chromium
 *   doesn't recognize. Harmless; the extensions still work.
 *
 * - sandboxed_renderer.bundle.js / "object null is not iterable
 *   (cannot read property Symbol(Symbol.iterator))": Electron 30+ bug
 *   when an installed Chromium extension is injected into a renderer
 *   running with contextIsolation + sandbox:false. DevTools still
 *   function; the error is purely log noise.
 */
const ELECTRON_STDERR_NOISE: RegExp[] = [
  /Autofill\.enable/,
  /ExtensionLoadWarning/,
  /Permission '.+' is unknown or URL pattern is malformed/,
  /sandboxed_renderer\.bundle\.js script failed to run/,
  /TypeError: object null is not iterable.*Symbol\(Symbol\.iterator\)/,
  /\(Use `electron --trace-warnings/
];

/**
 * Patterns for known-noisy Vite dev-server output. Vite is far quieter
 * than CRA's webpack stack was — the legacy sass-loader deprecation and
 * webpack-dev-server middleware warnings are gone. Filter list stays in
 * place so new upstream noise can be silenced without restructuring.
 */
const REACT_STDOUT_NOISE: RegExp[] = [];

interface SpawnOptionsBundle {
  hideLogs: SpawnSyncOptions;
  showLogs: SpawnSyncOptions;
}

/**
 * Scripts to start Electron, React, and Python.
 */
export class Starter {
  /**
   * Starts developer mode.
   *
   * Spawns three children: webpack-dev-server (React), Flask (via Electron),
   * and Electron itself. Closing the Electron window kills the whole tree —
   * see the cleanup logic below. This used to leak orphan node/python
   * processes when the user shut down via the Electron window.
   */
  developerMode = async (): Promise<void> => {
    const spawnOptions: SpawnOptionsBundle = {
      hideLogs: { shell: true, stdio: 'pipe' },
      showLogs: { shell: true, stdio: 'inherit' }
    };

    /**
     * Method to get first port in range of 3001-3999,
     * Remains unused here so will be the same as the
     * port used in main.ts
     */
    const port = await getPort({
      port: getPort.makeRange(3001, 3999)
    });

    // Kill anything already on the React port.
    spawnSync('npx kill-port 3000', spawnOptions.hideLogs);

    // Start Vite dev server. host/port/strictPort are configured in
    // vite.config.ts:
    //   host: '127.0.0.1' — bind to loopback so Windows Defender Firewall
    //     does not prompt; the renderer talks to it via http://127.0.0.1:3000.
    //   open: false — Electron is the renderer; no browser tab needed.
    //   strictPort: true — fail fast if 3000 is occupied instead of silently
    //     drifting to 3001 (which Electron wouldn't find).
    // stdout/stderr is piped so REACT_STDOUT_NOISE can filter noise if any
    // appears; Vite is quiet by default, so the filter list is empty today.
    const reactSpawnOptions: SpawnOptions = {
      detached: false, shell: true, stdio: ['inherit', 'pipe', 'pipe']
    };
    const reactProc = spawn('vite', reactSpawnOptions);
    // ANSI color codes get stripped before pattern matching so anchored
    // patterns (^LOG from ...) still match webpack's colored output. The
    // ORIGINAL line is what gets forwarded, so colors stay intact for
    // anything we don't filter.
    //
    // Match the full escape sequence — `\x1b[<digits>;<digits>m`. Built
    // via the RegExp constructor with String.fromCharCode(0x1b) so the
    // literal ESC byte never appears in a regex literal — that would trip
    // ESLint's `no-control-regex` rule. Equivalent pattern at runtime.
    const ANSI_RE = new RegExp(`${String.fromCharCode(0x1b)}\\[[0-9;]*m`, 'g');
    const filterStream = (
      input: NodeJS.ReadableStream | null,
      sink: NodeJS.WritableStream,
      patterns: RegExp[]
    ): void => {
      if (!input) return;
      const rl = readline.createInterface({ input });
      rl.on('line', (line: string) => {
        const clean = line.replace(ANSI_RE, '');
        if (patterns.some((p) => p.test(clean))) return;
        sink.write(`${line}\n`);
      });
    };
    filterStream(reactProc.stdout, process.stdout, REACT_STDOUT_NOISE);
    filterStream(reactProc.stderr, process.stderr, REACT_STDOUT_NOISE);

    // Compile main.ts + preload.ts to dist-electron/ before Electron starts.
    // package.json "main" points at dist-electron/main.js, so this output must
    // exist before `electron .` runs. Synchronous so dev startup is sequential
    // and any TS errors surface up front instead of after the loader appears.
    spawnSync('tsc -p tsconfig.electron.json', spawnOptions.showLogs);

    // Spawn Electron with stderr piped (not inherited) so we can filter out
    // known-harmless DevTools chatter. stdout still inherits — real Chromium
    // logs and our own console.log calls stay visible.
    const electronSpawnOptions: SpawnOptions = {
      detached: false,
      shell: true,
      stdio: ['inherit', 'inherit', 'pipe']
    };
    const electronProc = spawn('electron .', electronSpawnOptions);
    filterStream(electronProc.stderr, process.stderr, ELECTRON_STDERR_NOISE);

    let shuttingDown = false;
    const isWindows = process.platform === 'win32';

    // Kill a child process tree (parent + descendants).
    const killTree = (proc: ChildProcess | null | undefined): void => {
      if (!proc || !proc.pid) return;
      if (isWindows) {
        // taskkill /T walks the descendant tree; /F = force.
        spawnSync('taskkill', ['/pid', String(proc.pid), '/T', '/F'], {
          stdio: 'ignore'
        });
      } else {
        try { process.kill(-proc.pid, 'SIGTERM'); } catch { /* already gone */ }
        try { proc.kill('SIGTERM'); } catch { /* already gone */ }
      }
    };

    const shutdown = (_reason: string): void => {
      if (shuttingDown) return;
      shuttingDown = true;

      // Best-effort: tell Flask to terminate itself. Use Node's built-in
      // http rather than pulling in a dependency just for one fire-and-
      // forget request. ECONNRESET / ECONNREFUSED are expected if Flask
      // already exited; anything else gets logged.
      try {
        const req = http.get(`http://127.0.0.1:${port}/quit`);
        req.on('error', (error: NodeJS.ErrnoException) => {
          const expected = ['ECONNRESET', 'ECONNREFUSED'];
          if (error.code && !expected.includes(error.code)) console.log(error);
        });
        req.setTimeout(1000, () => req.destroy());
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ESRCH') console.error(error);
      }

      // Kill the React dev server tree (cross-env -> node -> webpack).
      killTree(reactProc);

      // Electron may have already exited; killing its tree is idempotent.
      killTree(electronProc);

      // Give the kills a moment to flush, then exit the dispatcher.
      setTimeout(() => process.exit(0), 250).unref();
    };

    // When the user closes the Electron window, take the whole dev stack down.
    electronProc.on('exit', () => shutdown('electron-exit'));

    // If the React dev server crashes, also tear everything down — running
    // Electron without the dev server is useless.
    reactProc.on('exit', (code) => {
      if (!shuttingDown) shutdown(`react-exit-${code}`);
    });

    // OS-level signals to the dispatcher itself (Ctrl+C in the terminal).
    (['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK'] as const).forEach((signal) => {
      process.on(signal, () => shutdown(signal));
    });

    process.on('uncaughtException', (err) => {
      console.error('uncaughtException in dispatcher:', err);
      shutdown('uncaughtException');
    });
  };
}
