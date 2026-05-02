---
name: add-flask-route
description: Use this skill when the user wants to add a new Python/Flask endpoint and call it from the React frontend. Triggers include "add a Python endpoint", "expose a Flask route to React", "wire a new backend service", "add /something route". Covers the full round-trip — Flask side, renderer side, and the rebuild step that production needs.
---

# Add a Flask route + React caller

**Scope rules (load-bearing):** see [CLAUDE.md](../../../CLAUDE.md) "Scope discipline". Two rules apply here:
- Minimum diff: edit `app.py` and the existing renderer helper. Do not split `requirements.txt`, do not introduce blueprints/app factories/logging modules.
- Zero-install for end users: any new Python dep must be bundleable by PyInstaller (add to `requirements.txt` and verify it lands in the `app.spec` build). Do not add code that shells out to `pip` or system Python at runtime.

## Step 1 — add the route in `app.py`

Place the new block under the `# REST CALLS` banner, before `/quit`. Match the existing style:

```python
@app.route("/<your-route>", methods=["GET"])  # or POST, etc.
def your_route():
    # GET: read query args via request.args.get("key")
    # POST: body = request.get_json()
    return jsonify({"result": "..."})
```

Rules:
- Always return via `jsonify(...)`. The renderer's helpers call `.json()` on the response.
- Do not hardcode a port. The port is `sys.argv[1]`, set by Electron.
- Do not introduce blueprints, app factories, or restructure — `app.py` is single-file by design.

## Step 2 — call it from React

Use the helpers in `src/utils/requests.js`. Do NOT use `axios` or raw `fetch` in components — the helpers already inject the dev-mode port via IPC.

GET:
```js
import { get } from '<relative-path>/utils/requests';

get(
  'your-route',                       // route, no leading slash, no http://
  (response) => { /* success */ },
  (error)    => console.error(error)
);
```

POST:
```js
import { post } from '<relative-path>/utils/requests';

post(
  JSON.stringify({ key: 'value' }),   // body must be a string
  'your-route',
  (response) => { /* success */ },
  (error)    => console.error(error)
);
```

Note: `post()` in `requests.js` does not stringify for you — pass a JSON string, not an object.

## Step 3 — verify in dev

Run `yarn start`. Hit your route from a component (or a `useEffect` like `App.js` does at line 19). Watch the React DevTools network tab and the Flask terminal for the request.

## Step 4 — production rebuild

`app.py` is bundled into a standalone binary by PyInstaller during `yarn build:python` (run automatically by `yarn build` and the `build:package:*` scripts). **Editing `app.py` does not affect the packaged app until you rerun the build.** Tell the user this if they're testing an installer.

## CORS reminder

Dev mode allows only `http://localhost*` origins. Production has no CORS layer at all (the if-branch in `app.py` skips it). Don't add origins without an explicit reason.
