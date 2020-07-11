# Electron, React, & Python Template
> Reusable template for Electron projects which uses a React front-end and is integrated with Python/Flask micro services.
<br>

# ⚙️ Config
* **Integrating:** See `./utils/requests.js` for pre-made React request functions. You can use these to invoke your Python scripts in `app.py`.
* **React:** React files can be found in the `./src/` folder.
* **Python:** Python can be created in the `./app.py` file.

# 🛠️ Setup
Clone this repository, navigate to its directory, and install Python requirements:

**requirements:**
```bash
pip3 install -r requirements.txt
```

You can run the Flask server manually to run your own tests from the root directory with:
**flask:**
```bash
py app.py
```

# 📜 Scripts
To use your React/Python app in Electron, you must build it with:

**build:**
```bash
npm run build
```

To start Electron, using your React build for its HTML page, use:
**start electron:**
```bash
npm run start
```

To develop in the browser with React, use:
**start react:**
```bash
npm run start:react
```
