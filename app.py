from flask import Flask

app = Flask(__name__)

@app.route("/<command>")
def index(command):
  if command == "one":
    return "one"


# Available for manual testing
if __name__ == "__main__":
  app.run(host="127.0.0.1", port=8081)