#!/usr/bin/env python3
"""Exercise the public deployment boundary without touching the working tree."""

import importlib.util
from pathlib import Path
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "build-public-site.py"
SPEC = importlib.util.spec_from_file_location("build_public_site", SCRIPT)
PACKAGER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PACKAGER)


class PublicSiteTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.source = self.root / "source"
        self.source.mkdir()
        for name, content in {
            "index.html": "monitor",
            "globe.html": "legacy globe",
            "LICENSE": "license",
            "README.md": "public readme",
            "css/monitor.css": "css",
            "js/monitor.js": "js",
            "assets/map/font.pbf": "font",
            "data/monitor-feed.json": '{"items": []}',
            "data/official-cases.js": "cases",
            "data/normalized/cases.jsonl": "normalized",
            "preview/index.html": "preview directory",
            "preview/existing/globe.html": "existing public URL",
            "preview/existing/assets/icon.svg": "existing asset",
            "tools/private.py": "internal tool",
            "tests/private.js": "internal test",
            "docs/assessment.html": "internal document",
            ".env": "private settings",
            ".git/config": "private repository metadata",
            "data/sources/raw/archive.pdf": "acquisition archive",
            "data/.DS_Store": "desktop metadata",
            "assets/.DS_Store": "desktop metadata",
        }.items():
            path = self.source / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
        self.output = self.root / "_site"

    def test_preserves_public_routes_and_excludes_internal_files(self):
        PACKAGER.build_site(self.source, self.output)
        for name in (
            "index.html", "globe.html", "LICENSE", "README.md",
            "css/monitor.css", "js/monitor.js", "assets/map/font.pbf",
            "data/monitor-feed.json", "data/official-cases.js",
            "data/normalized/cases.jsonl", "preview/index.html",
            "preview/existing/globe.html", "preview/existing/assets/icon.svg",
            ".nojekyll",
        ):
            with self.subTest(public=name):
                self.assertTrue((self.output / name).is_file())
        for name in (
            "tools", "tests", "docs", ".env", ".git", "data/sources",
            "data/.DS_Store", "assets/.DS_Store",
        ):
            with self.subTest(private=name):
                self.assertFalse((self.output / name).exists())

    def test_rebuild_removes_obsolete_output(self):
        self.output.mkdir()
        (self.output / "obsolete.html").write_text("stale")
        PACKAGER.build_site(self.source, self.output)
        self.assertFalse((self.output / "obsolete.html").exists())

    def test_accepts_default_output_inside_repository(self):
        output = PACKAGER.build_site(self.source, self.source / "_site")
        self.assertTrue((output / "index.html").is_file())

    def test_refuses_destructive_or_recursive_output_paths(self):
        for output in (self.source, self.root, self.source / "assets" / "_site"):
            with self.subTest(output=output), self.assertRaises(ValueError):
                PACKAGER.build_site(self.source, output)
        self.assertEqual((self.source / "index.html").read_text(), "monitor")

    def test_missing_runtime_asset_leaves_existing_output_untouched(self):
        self.output.mkdir()
        marker = self.output / "keep.html"
        marker.write_text("previous build")
        (self.source / "data/monitor-feed.json").unlink()
        with self.assertRaisesRegex(ValueError, "monitor-feed.json"):
            PACKAGER.build_site(self.source, self.output)
        self.assertTrue(marker.is_file())

    def test_refuses_symlinks_without_following_private_content(self):
        private = self.root / "secret.txt"
        private.write_text("private")
        (self.source / "assets" / "linked.txt").symlink_to(private)
        with self.assertRaisesRegex(ValueError, "Symbolic links"):
            PACKAGER.build_site(self.source, self.output)
        self.assertFalse(self.output.exists())


if __name__ == "__main__":
    unittest.main()
