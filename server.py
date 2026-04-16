#!/usr/bin/env python3
"""
Kanban demo server — pure-Python replacement for the Node/Express server.
Serves the built frontend from ./dist and provides the /data.json,
/data-source, and /profiles/* API endpoints.

Usage:
    python3 server.py          # default port 8000
    python3 server.py 9000     # custom port

Profile files live in ./profiles/*.json
"""
import http.server
import json
import os
import re
import sys
import urllib.parse
from pathlib import Path

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", 8000))
BASE_DIR     = Path(__file__).parent
DIST_DIR     = BASE_DIR / "dist"
PROFILES_DIR = BASE_DIR / "profiles"
PROFILES_DIR.mkdir(exist_ok=True)

# Local data file (relative to BASE_DIR)
LOCAL_DATA_FILE = "data.json"

# Only allow safe characters in profile names (no path traversal)
_SAFE = re.compile(r'^[\w\- ]+$')

def _safe_path(name: str):
    name = urllib.parse.unquote(name).removesuffix(".json").strip()
    if not name or not _SAFE.match(name):
        return None
    return PROFILES_DIR / f"{name}.json"


class KanbanHandler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        # Serve static files from dist/ (the built frontend)
        super().__init__(*args, directory=str(DIST_DIR), **kwargs)

    # ── routing ──────────────────────────────────────────────────────────────

    def do_GET(self):
        # Strip query string for routing
        route = self.path.split("?")[0].rstrip("/")
        if route == "/data.json":
            self._serve_data()
        elif route == "/data-source":
            self._serve_data_source()
        elif route == "/profiles":
            names = sorted(p.stem for p in PROFILES_DIR.glob("*.json"))
            self._json(names)
        elif route.startswith("/profiles/"):
            self._get_profile(route[len("/profiles/"):])
        else:
            # Try to serve the static file; fall back to index.html for SPA routes
            static = DIST_DIR / route.lstrip("/")
            if not static.exists() or static.is_dir():
                self.path = "/index.html"
            super().do_GET()

    def end_headers(self):
        # Prevent browser from caching so data.json is always re-fetched
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_POST(self):
        if self.path.startswith("/profiles/"):
            self._save_profile(self.path[len("/profiles/"):])
        else:
            self.send_error(404)

    def do_DELETE(self):
        if self.path.startswith("/profiles/"):
            self._delete_profile(self.path[len("/profiles/"):])
        else:
            self.send_error(404)

    # ── handlers ─────────────────────────────────────────────────────────────

    def _serve_data(self):
        data_path = BASE_DIR / LOCAL_DATA_FILE
        if not data_path.exists():
            self.send_error(404, "data.json not found")
            return
        self._json(json.loads(data_path.read_text()))

    def _serve_data_source(self):
        self._json({"source": "local", "localFile": LOCAL_DATA_FILE})

    def _get_profile(self, name: str):
        path = _safe_path(name)
        if not path or not path.exists():
            self.send_error(404, "Profile not found")
            return
        self._json(json.loads(path.read_text()))

    def _save_profile(self, name: str):
        path = _safe_path(name)
        if not path:
            self.send_error(400, "Invalid profile name")
            return
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return
        path.write_text(json.dumps(data, indent=2))
        print(f"  saved profile → {path.name}")
        self._json({"ok": True, "name": path.stem})

    def _delete_profile(self, name: str):
        path = _safe_path(name)
        if path and path.exists():
            path.unlink()
            print(f"  deleted profile → {path.name}")
        self._json({"ok": True})

    # ── helpers ──────────────────────────────────────────────────────────────

    def _json(self, data):
        body = json.dumps(data).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        # Only print profile API calls; suppress static file noise
        if "/profiles" in (args[0] if args else ""):
            print(f"  {self.command} {self.path}")


if __name__ == "__main__":
    print(f"Kanban server  →  http://localhost:{PORT}")
    print(f"Serving from   →  {DIST_DIR}")
    print(f"Profiles dir   →  {PROFILES_DIR}")
    print()
    http.server.HTTPServer(("", PORT), KanbanHandler).serve_forever()
