#!/usr/bin/env python3
"""Package the public app, its data and existing preview URLs for GitHub Pages.

Only the explicit public paths below are copied. Source acquisition archives,
developer tools, tests and internal product documents are not deployment assets.
No JavaScript build dependencies are required.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import shutil


PUBLIC_FILES = ("index.html", "globe.html", "LICENSE", "README.md")
PUBLIC_DIRECTORIES = ("css", "js", "assets", "preview")
IGNORED_NAMES = {".DS_Store", "Thumbs.db", "__pycache__", ".git", "node_modules"}


def _validate_tree(path: Path) -> None:
    """Pages artifacts cannot contain symbolic links; never follow one."""
    if path.is_symlink():
        raise ValueError(f"Symbolic links are not public assets: {path}")
    if path.is_dir():
        for child in path.iterdir():
            if child.name not in IGNORED_NAMES:
                _validate_tree(child)


def _ignore(directory: str, names: list[str]) -> set[str]:
    return set(names) & IGNORED_NAMES


def build_site(source: Path, output: Path) -> Path:
    """Create a clean allowlisted Pages root and return its absolute path."""
    source = Path(source).resolve(strict=True)
    raw_output = Path(output).absolute()
    if raw_output.is_symlink():
        raise ValueError("The output directory must not be a symbolic link")
    output = raw_output.resolve()
    if output == source or output in source.parents:
        raise ValueError("The output must not replace the source or its parents")
    public_paths = [source / name for name in PUBLIC_FILES + PUBLIC_DIRECTORIES]
    public_paths.append(source / "data")
    if any(output == path or path in output.parents for path in public_paths):
        raise ValueError("The output must not be inside a public asset directory")
    for required in ("index.html", "globe.html", "data/monitor-feed.json"):
        if not (source / required).is_file():
            raise ValueError(f"Required public asset is missing: {required}")

    # Complete validation before clearing an older output directory.
    paths = [path for path in public_paths[:-1] if path.exists() or path.is_symlink()]
    data_paths = sorted(path for path in (source / "data").iterdir()
                        if path.suffix in {".json", ".js"})
    normalized = source / "data" / "normalized"
    if normalized.exists() or normalized.is_symlink():
        data_paths.append(normalized)
    for path in paths + data_paths:
        _validate_tree(path)

    if output.exists():
        if not output.is_dir():
            raise ValueError("The output path must be a directory")
        shutil.rmtree(output)
    output.mkdir(parents=True)
    for path in paths:
        destination = output / path.name
        if path.is_dir():
            shutil.copytree(path, destination, ignore=_ignore)
        else:
            shutil.copy2(path, destination)
    (output / "data").mkdir()
    for path in data_paths:
        destination = output / "data" / path.name
        if path.is_dir():
            shutil.copytree(path, destination, ignore=_ignore)
        else:
            shutil.copy2(path, destination)
    (output / ".nojekyll").touch()
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path("."))
    parser.add_argument("--output", type=Path, default=Path("_site"))
    args = parser.parse_args()
    try:
        output = build_site(args.source, args.output)
    except (OSError, ValueError) as error:
        parser.exit(1, f"Public packaging failed: {error}\n")
    print(f"Public site packaged at {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
