import os
import sys
import threading
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Bind to localhost only. The Electron renderer is the sole intended client,
# and it talks to us via http://localhost:<port>. Binding 0.0.0.0 would expose
# Flask (including /quit) to the LAN with no auth.
app_config = {
  "host": "127.0.0.1",
  "port": sys.argv[1],
  # Werkzeug's interactive debugger is a code-execution surface (PIN-gated
  # but the PIN is weak). Off in all modes; use logging if you need traces.
  "debug": False,
  "use_debugger": False,
  "use_reloader": False,
}

"""
---------------------- DEVELOPER MODE CONFIG -----------------------
"""
# Developer mode uses app.py
if "app.py" in sys.argv[0]:
  # CORS settings — accept the React dev server on port 3000 only (the
  # only origin in dev). Both spellings of loopback are listed because
  # Electron loads 127.0.0.1:3000 to dodge IPv6 resolution of "localhost"
  # on Windows, but a developer hitting the page directly may use either.
  cors = CORS(
    app,
    resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}},
  )

  # CORS headers
  app.config["CORS_HEADERS"] = "Content-Type"


"""
--------------------------- REST CALLS -----------------------------
"""
# Remove and replace with your own
@app.route("/example")
def example():

  # See /src/components/App.js for frontend call
  return jsonify("Example response from Flask! Learn more in /app.py & /src/components/App.js")


"""
-------------------------- APP SERVICES ----------------------------
"""
# Quits Flask on Electron exit.
#
# werkzeug.server.shutdown was removed in Werkzeug >= 2.1, so we cannot use the
# old environ-based hook. Instead we acknowledge the request, then terminate
# the process from a short-lived thread once the response has been sent.
@app.route("/quit")
def quit_app():
  def _terminate():
    os._exit(0)

  threading.Timer(0.1, _terminate).start()
  return jsonify({"status": "shutting down"})


if __name__ == "__main__":
  app.run(**app_config)
