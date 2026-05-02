"""
Pipe-test for verify-on-change.py. Builds proper JSON inputs and verifies
each scenario produces the right behavior. Run: python test_verify_on_change.py
"""
import json
import subprocess
import sys
from pathlib import Path

HOOK = Path(__file__).with_name("verify-on-change.py")

CASES = [
    # (path, should_emit_json)
    ("C:\\Engineering\\electron-react-python-template\\src\\components\\App.js", True),
    ("C:\\Engineering\\electron-react-python-template\\app.py", True),
    ("C:\\Engineering\\electron-react-python-template\\main.js", True),
    ("C:\\Engineering\\electron-react-python-template\\preload.js", True),
    ("C:\\Engineering\\electron-react-python-template\\package.json", True),
    ("C:\\Engineering\\electron-react-python-template\\requirements.txt", True),
    ("C:\\Engineering\\electron-react-python-template\\scripts\\build.js", True),
    ("C:\\Engineering\\electron-react-python-template\\tests\\test_app.py", True),
    ("/c/Engineering/electron-react-python-template/src/index.js", True),
    ("C:\\Engineering\\electron-react-python-template\\CLAUDE.md", False),
    ("C:\\Engineering\\electron-react-python-template\\README.md", False),
    ("C:\\Engineering\\electron-react-python-template\\.claude\\agents\\foo.md", False),
    ("C:\\Engineering\\electron-react-python-template\\.claude\\hooks\\verify-on-change.py", False),
    ("C:\\Engineering\\electron-react-python-template\\node_modules\\react\\index.js", False),
    ("C:\\Engineering\\electron-react-python-template\\build\\static\\js\\main.js", False),
    ("C:\\Engineering\\electron-react-python-template\\dist\\windows\\app.exe", False),
    ("C:\\Engineering\\electron-react-python-template\\public\\index.html", False),
    ("C:\\Engineering\\electron-react-python-template\\docs\\index.html", False),
]


def run(payload):
    blob = json.dumps(payload)
    proc = subprocess.run(
        [sys.executable, str(HOOK)],
        input=blob,
        capture_output=True,
        text=True,
        timeout=10,
    )
    return proc.returncode, proc.stdout, proc.stderr


def main():
    failures = 0
    for path, should_emit in CASES:
        payload = {"tool_name": "Edit", "tool_input": {"file_path": path}}
        rc, out, err = run(payload)
        emitted = bool(out.strip())
        ok = rc == 0 and emitted == should_emit
        marker = "OK " if ok else "FAIL"
        print(f"  [{marker}] emit={emitted} expected={should_emit} rc={rc}  {path}")
        if not ok:
            failures += 1
            if err:
                print(f"        stderr: {err.strip()}")
            if out:
                print(f"        stdout: {out.strip()[:120]}")
    print()
    if failures:
        print(f"FAIL: {failures} case(s) failed")
        return 1
    print(f"OK: all {len(CASES)} cases pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
