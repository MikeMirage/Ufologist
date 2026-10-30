#!/usr/bin/env python3
"""Exercise the actual local HTTP contract without touching external feeds."""
import json
from http.server import ThreadingHTTPServer
from pathlib import Path
import sys
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).parent))
import serve_monitor


class LocalServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), serve_monitor.MonitorHandler)
        cls.base = 'http://127.0.0.1:%s' % cls.server.server_port
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def post(self, origin=None, body=b'{}'):
        headers = {'Content-Type': 'application/json'}
        if origin:
            headers['Origin'] = origin
        req = Request(self.base + '/api/monitor/refresh', data=body, headers=headers, method='POST')
        try:
            with urlopen(req) as response:
                return response.status, json.load(response)
        except HTTPError as response:
            return response.code, json.load(response)

    def test_cross_origin_cannot_trigger_refresh(self):
        with patch.object(serve_monitor, 'refresh_snapshot') as refresh:
            status, _ = self.post('https://unrelated.example')
            self.assertEqual(status, 403)
            refresh.assert_not_called()

    def test_same_origin_refresh_and_no_hammering(self):
        serve_monitor.LAST_REFRESH = None
        result = {'generatedAt': '2026-10-30T00:00:00Z', 'items': [], 'sources': []}
        with patch.object(serve_monitor, 'refresh_snapshot', return_value=result) as refresh:
            self.assertEqual(self.post(self.base)[0], 200)
            self.assertEqual(self.post(self.base)[1]['status'], 'current')
            refresh.assert_called_once()

    def test_failed_refresh_is_recoverable(self):
        serve_monitor.LAST_REFRESH = None
        with patch.object(serve_monitor, 'refresh_snapshot', side_effect=RuntimeError('unavailable')):
            self.assertEqual(self.post(self.base)[0], 503)

    def test_hidden_repository_data_is_not_served(self):
        with self.assertRaises(HTTPError) as caught:
            urlopen(self.base + '/.git/config')
        self.assertEqual(caught.exception.code, 404)


if __name__ == '__main__':
    unittest.main()
