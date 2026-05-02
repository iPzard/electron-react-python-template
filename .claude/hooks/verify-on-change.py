#!/usr/bin/env python3
"""
PostToolUse hook for Edit|Write|MultiEdit.

Reads the JSON tool-input event from stdin, decides whether the edited file
is part of the project's verification surface, and if so prints a JSON
response asking Claude to invoke the `change-verifier` agent.

Exits 0 silently for files outside the verification surface (docs, CLAUDE.md,
.claude/, node_modules, build/, dist/, resources/) so unrelated edits don't
trigger noise.
"""
import json
import os
import sys


def normalize(path: str) -> str:
    return path.replace("\\", "/")


def is_excluded(p: str) -> bool:
    excluded_dirs = (
        "/node_modules/", "/.claude/", "/docs/", "/build/", "/dist/",
        "/dist-electron/", "/resources/",
    )
    if any(seg in p for seg in excluded_dirs):
        return True
    lower = p.lower()
    if lower.endswith((".md", ".markdown")):
        return True
    return False


def is_in_scope(p: str) -> bool:
    in_scope_dirs = ("/src/", "/scripts/", "/tests/")
    if any(seg in p for seg in in_scope_dirs):
        return True
    base = os.path.basename(p)
    in_scope_files = (
        "app.py",
        "main.ts",
        "preload.ts",
        "package.json",
        "requirements.txt",
        "tsconfig.json",
        "tsconfig.electron.json",
        "tsconfig.scripts.json",
    )
    return base in in_scope_files


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0

    file_path = (payload.get("tool_input") or {}).get("file_path") or ""
    if not file_path:
        return 0

    norm = normalize(file_path)

    if is_excluded(norm):
        return 0
    if not is_in_scope(norm):
        return 0

    response = {
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": (
                "A project source file was just edited. Before doing anything else, "
                "invoke the `change-verifier` agent (defined in "
                "`.claude/agents/change-verifier.md`) to run `yarn verify` "
                "(lint -> jest -> pytest -> React build) and report or auto-fix any "
                "failures. Do not skip this — the verification chain is how "
                "regressions get caught."
            ),
        }
    }
    sys.stdout.write(json.dumps(response))
    return 0


if __name__ == "__main__":
    sys.exit(main())
