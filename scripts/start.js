const { spawn, spawnSync } = require('child_process');
const http = require('http');
const readline = require('readline');
const getPort = require('get-port');

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
const ELECTRON_STDERR_NOISE = [
  /Autofill\.enable/,
  /ExtensionLoadWarning/,
  /Permission '.+' is unknown or URL pattern is malformed/,
  /sandboxed_renderer\.bundle\.js script failed to run/,
  /TypeError: object null is not iterable.*Symbol\(Symbol\.iterator\)/,
  /\(Use `electron --trace-warnings/
];

/**
 * Patterns for known-noisy webpack-dev-server / sass-loader output. Same
 * deal as ELECTRON_STDERR_NOISE — these are upstream issues in CRA 5's
 * bundled adapters that we can't fix without ejecting.
 *
 * - DEP_WEBPACK_DEV_SERVER_ON_(AFTER|BEFORE)_SETUP_MIDDLEWARE: CRA 5 uses
 *   webpack-dev-server 4's deprecated middleware hooks. Will be fixed
 *   when CRA upgrades to setupMiddlewares.
 * - sass legacy JS API deprecation: sass 1.99 deprecated the legacy JS
 *   API; CRA 5's bundled sass-loader still calls it. Fires once per
 *   .module.scss file in the project, so it's loud (5+ blocks here).
 *
 * Filter is intentionally narrow — anything that doesn't contain one of
 * these specific phrases falls through verbatim. If you start seeing
 * unexpected silence, narrow the patterns further.
 */
const REACT_STDOUT_NOISE = [
  /DEP_WEBPACK_DEV_SERVER_ON_(AFTER|BEFORE)_SETUP_MIDDLEWARE/,
  /\(Use `node --trace-deprecation /,
  /^LOG from .*sass-loader/,
  /legacy JS API is deprecated/,
  /sass-lang\.com\/d\/legacy-js-api/,
  /^<w>\s*$/,
  /^<w> null\s*$/,
  /^<w> More info: https:\/\/sass-lang\.com/
];

/**
 * @namespace Starter
 * @description - Scripts to start Electron, React, and Python.
 */
class Starter {
  /**
   * @description - Starts developer mode.
   *
   * Spawns three children: webpack-dev-server (React), Flask (via Electron),
   * and Electron itself. Closing the Electron window kills the whole tree —
   * see the cleanup logic below. This used to leak orphan node/python
   * processes when the user shut down via the Electron window.
   *
   * @memberof Starter
   */
  developerMode = async () => {
    const spawnOptions = {
      hideLogs: { detached: false, shell: true, stdio: 'pipe' },
      showLogs: { detached: false, shell: true, stdio: 'inherit' }
    };

    /**
     * Method to get first port in range of 3001-3999,
     * Remains unused here so will be the same as the
     * port used in main.js
     */
    const port = await getPort({
      port: getPort.makeRange(3001, 3999)
    });

    // Kill anything already on the React port.
    spawnSync('npx kill-port 3000', spawnOptions.hideLogs);

    // Start React dev server.
    //   HOST=127.0.0.1 — bind to loopback so Windows Defender Firewall does
    //     not prompt; the renderer talks to it via http://127.0.0.1:3000.
    //   BROWSER=none — Electron is the renderer; no browser tab needed.
    //   DISABLE_ESLINT_PLUGIN=true — CRA 5 ships eslint-config-react-app and
    //     loads it inside the webpack-dev-server overlay. Combined with this
    //     project's .eslintrc.js (which already lists `plugins: ['react']`),
    //     ESLint errors with "Plugin 'react' was conflicted between …".
    //     Disabling CRA's plugin keeps the overlay quiet; standalone
    //     `yarn lint` still runs the airbnb config we want.
    // Pipe react-scripts stdout/stderr so we can filter known-noisy upstream
    // deprecation chatter (see REACT_STDOUT_NOISE). Real errors fall through.
    const reactProc = spawn(
      'cross-env BROWSER=none HOST=127.0.0.1 DISABLE_ESLINT_PLUGIN=true react-scripts start',
      { detached: false, shell: true, stdio: ['inherit', 'pipe', 'pipe'] }
    );
    // ANSI color codes get stripped before pattern matching so anchored
    // patterns (^LOG from ...) still match webpack's colored output. The
    // ORIGINAL line is what gets forwarded, so colors stay intact for
    // anything we don't filter.
    const ANSI_RE = /\[[0-9;]*m/g;
    const filterStream = (input, sink, patterns) => {
      if (!input) return;
      const rl = readline.createInterface({ input });
      rl.on('line', (line) => {
        const clean = line.replace(ANSI_RE, '');
        if (patterns.some((p) => p.test(clean))) return;
        sink.write(`${line}\n`);
      });
    };
    filterStream(reactProc.stdout, process.stdout, REACT_STDOUT_NOISE);
    filterStream(reactProc.stderr, process.stderr, REACT_STDOUT_NOISE);

    // Spawn Electron with stderr piped (not inherited) so we can filter out
    // known-harmless DevTools chatter. stdout still inherits — real Chromium
    // logs and our own console.log calls stay visible.
    const electronProc = spawn('electron .', {
      detached: false,
      shell: true,
      stdio: ['inherit', 'inherit', 'pipe']
    });
    filterStream(electronProc.stderr, process.stderr, ELECTRON_STDERR_NOISE);

    let shuttingDown = false;
    const isWindows = process.platform === 'win32';

    // Kill a child process tree (parent + descendants).
    const killTree = (proc) => {
      if (!proc || !proc.pid) return;
      if (isWindows) {
        // taskkill /T walks the descendant tree; /F = force.
        spawnSync('taskkill', ['/pid', String(proc.pid), '/T', '/F'], {
          stdio: 'ignore'
        });
      } else {
        try { process.kill(-proc.pid, 'SIGTERM'); } catch (e) { /* already gone */ }
        try { proc.kill('SIGTERM'); } catch (e) { /* already gone */ }
      }
    };

    const shutdown = (reason) => {
      if (shuttingDown) return;
      shuttingDown = true;

      // Best-effort: tell Flask to terminate itself. Use Node's built-in
      // http rather than pulling in a dependency just for one fire-and-
      // forget request. ECONNRESET / ECONNREFUSED are expected if Flask
      // already exited; anything else gets logged.
      try {
        const req = http.get(`http://127.0.0.1:${port}/quit`);
        req.on('error', (error) => {
          const expected = ['ECONNRESET', 'ECONNREFUSED'];
          if (!expected.includes(error.code)) console.log(error);
        });
        req.setTimeout(1000, () => req.destroy());
      } catch (error) {
        if (error.code !== 'ESRCH') console.error(error);
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
    ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK'].forEach((signal) => {
      process.on(signal, () => shutdown(signal));
    });

    process.on('uncaughtException', (err) => {
      console.error('uncaughtException in dispatcher:', err);
      shutdown('uncaughtException');
    });
  };
}

module.exports = { Starter };
