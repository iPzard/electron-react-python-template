
import sys
from flask import Flask

app = Flask(__name__)

""" Get Flask port:
Accepts port as system argument
e.g., `start app.exe 3000`
"""
port = sys.argv[1]


""" Microservice commands:
Use this area below as an example
of how you can add your own REST
commands.
"""
@app.route("/<command>")
def index(command):

  # Serves as an example, erase and write your code here.
  if command == "one":
    return "one"


"""
Start flask microservice server:
Uses a random port between 3000
and 3999.
"""
if __name__ == '__main__':
  app.run(host='0.0.0.0', port=port)