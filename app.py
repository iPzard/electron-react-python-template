from flask import Flask

app = Flask(__name__)

@app.route("/<command>")
def index(command):

  # Serves as an example, erase and write your code here.
  if command == "one":
    return "one"
