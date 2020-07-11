# Electron, React, & Python Template
> Reusable template for Electron projects which uses a React front-end and is integrated with Python/Flask microservices.
<br>

# ⚙️ Config
See `./utils/requests.js` for pre-made React request functions. You can use these to invoke your Python scripts in `app.py`.

**React:** React files can be found in the `./src/` folder.

**Python:** Python can be created in the `./app.py` file.

<br>

# 🛠️ Setup
Clone this repository, navigate to its directory, and install Node & Python dependencies:

**Install python dependencies:**
```bash
pip3 install -r requirements.txt
```

**Install node dependencies:**
```bash
npm install
```
<br>

# 📜 Scripts
To use your React/Python app in Electron, you must build it with:

**Build React:**
```bash
npm run build
```

To start Electron, using your React build for its HTML page, use:

**Start Electron:**
```bash
npm run start
```

To develop in the browser with React, use:

**Start React:**
```bash
npm run start:react
```

You can run the Flask server manually to run your own tests from the root directory with:

**Run Flask:**
```bash
py app.py
```
<br>

## 🏷️ License

MIT © [iPzard](https://github.com/iPzard/electron-react-python-template/blob/master/LICENSE)