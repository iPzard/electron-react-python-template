import sys
from flask import Flask, jsonify, request
from flask_cors import CORS
from Flask.hardwareMonitor import HardwareMonitor
app = Flask(__name__)
app_config = {"host": "localhost", "port": sys.argv[1]}

"""
---------------------- DEVELOPER MODE CONFIG -----------------------
"""
# Developer mode uses app.py
if "app.py" in sys.argv[0]:

    # Update app config
    app_config["debug"] = True

    origin = 'http'
    # CORS headers
    app.config["CORS_HEADERS"] = "Content-Type"


"""
--------------------------- REST CALLS -----------------------------
"""

# Remove and replace with your own
@app.route("/example")
def example():
    return jsonify("Hello world!")

hardwareMonitor = HardwareMonitor()

@app.route("/CPUPercent")
def getCPUUsage():
    origin = request.headers['origin']
    cpu = hardwareMonitor.getCPUPercentage()
    print(cpu)
    return sendResponse(cpu, origin)

@app.route("/CPUFreq")
def getCPUFrequency():
    origin = request.headers['origin']
    cpuFreq = hardwareMonitor.getCPUFrequency()
    return cpuFreq

@app.route("/GetCPUStats")
def getCPUStats():
    origin = request.headers["origin"]
    cpuPercent = hardwareMonitor.getCPUPercentage()
    cpuFreq = hardwareMonitor.getCPUFrequency()
    return sendResponse({ 'percent': cpuPercent, 'frequency': cpuFreq }, origin)
"""
-------------------------- APP SERVICES ----------------------------
"""

#This method takes in some data and formats a response(Incomplete, currently just sets access header and sends json value)
def sendResponse(content, origin):
    response = jsonify(content)
    response.headers.add('Access-Control-Allow-Origin', origin)
    return response


# Quits Flask on Electron exit
@app.route("/quit")
def quit():
    shutdown = request.environ.get("werkzeug.server.shutdown")
    shutdown()
    return


if __name__ == "__main__":
  app.run(**app_config)
