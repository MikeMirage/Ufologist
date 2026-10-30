#!/usr/bin/env python3
"""Local same-origin preview with an explicit, serialized real-feed refresh.

Static deployments consume data/monitor-feed.json and the scheduled workflow.
No API credential or external proxy is exposed by this server.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import threading
from urllib.parse import unquote, urlsplit

from update_monitor_feeds import refresh_snapshot

ROOT = Path(__file__).resolve().parents[1]
REFRESH_LOCK = threading.Lock()
LAST_REFRESH = None


class MonitorHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-UFOlogist-Refresh', 'available')
        if self.path.startswith(('/data/monitor-feed.json', '/api/')):
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def json_response(self, status, payload):
        content = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        parts = Path(unquote(urlsplit(self.path).path)).parts
        if any(part.startswith('.') or part == 'node_modules' for part in parts):
            self.send_error(404)
            return
        if self.path.startswith('/api/'):
            self.json_response(404, {'error': 'Unknown endpoint'})
            return
        super().do_GET()

    def do_POST(self):
        global LAST_REFRESH
        if urlsplit(self.path).path != '/api/monitor/refresh':
            self.json_response(404, {'error': 'Unknown endpoint'})
            return
        origin = self.headers.get('Origin')
        expected = 'http://' + self.headers.get('Host', '')
        if origin and origin != expected:
            self.json_response(403, {'error': 'Same-origin requests only'})
            return
        if self.headers.get('Content-Type', '').split(';')[0].strip() != 'application/json':
            self.json_response(415, {'error': 'Use application/json'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length < 0 or length > 1024:
                raise ValueError('Body too large')
            body = json.loads(self.rfile.read(length) or b'{}')
            if not isinstance(body, dict):
                raise ValueError('Expected an object')
        except (ValueError, json.JSONDecodeError):
            self.json_response(400, {'error': 'Invalid request body'})
            return
        if not REFRESH_LOCK.acquire(blocking=False):
            self.json_response(409, {'error': 'Refresh already running'})
            return
        try:
            now = datetime.now(timezone.utc)
            # A manual retry should not hammer seven origin sites.
            if LAST_REFRESH and (now - LAST_REFRESH).total_seconds() < 60:
                self.json_response(200, {'status': 'current', 'refreshedAt': LAST_REFRESH.isoformat()})
                return
            snapshot = refresh_snapshot()
            LAST_REFRESH = now
            self.json_response(200, {'status': 'updated', 'generatedAt': snapshot.get('generatedAt'),
                                     'items': len(snapshot.get('items', [])),
                                     'failedSources': sum(s.get('status') == 'error' for s in snapshot.get('sources', []))})
        except Exception:
            self.json_response(503, {'error': 'Refresh failed; the last valid snapshot is preserved'})
        finally:
            REFRESH_LOCK.release()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8642)
    parser.add_argument('--host', default='127.0.0.1', choices=['127.0.0.1', 'localhost', '::1'])
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), MonitorHandler)
    print('UFOlogist Monitor: http://%s:%s' % (args.host, args.port), flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
