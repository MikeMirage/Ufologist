#!/usr/bin/env bash
# ============================================================
# repo-slim.sh — reclaim the bloated .git (≈1 GB → ~100 MB)
#
# WHY: .git is ~1 GB because (1) preview/<branch>/ full-site
# snapshots + audio + large data JSON were committed ~50×, and
# (2) Git LFS caches every version of data/sources/raw/**.
#
# ⚠️ THIS REWRITES HISTORY AND FORCE-PUSHES. Run it ONLY in a
# coordinated maintenance window: everyone pushes first, nobody
# else touches the repo, and every clone must re-clone afterwards.
#
# Prereqs:  pipx install git-filter-repo    (or: brew install git-filter-repo)
#           brew install git-lfs            (or: apt-get install git-lfs)
#
# Usage:    bash tools/repo-slim.sh            # dry-run report only
#           bash tools/repo-slim.sh --apply    # actually do it
# ============================================================
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

APPLY=0
[ "${1:-}" = "--apply" ] && APPLY=1

echo "== current sizes =="
du -sh .git 2>/dev/null || true
git count-objects -vH | grep -E '^count|^size|^size-pack' || true
echo

if [ "$APPLY" -ne 1 ]; then
  cat <<'EOF'
DRY RUN. This would:
  1. Stop versioning build/deploy artefacts and raw sources:
       preview/  data/sources/  data/normalized/   (kept on disk)
  2. Purge them (and assets/audio history) from ALL git history via git-filter-repo.
  3. Prune the Git LFS local cache.
  4. Repack aggressively and force-push origin/main.

Re-run with --apply in a coordinated maintenance window.
Root-cause fix (do this too, outside this script):
  • The deploy pipeline must NOT copy data/audio into preview/<branch>/ snapshots.
  • Serve the big datasets (nuforc/official/geipan .json) from a CDN or release
    asset instead of re-committing 4–7 MB on every content change.
EOF
  exit 0
fi

command -v git-filter-repo >/dev/null 2>&1 || { echo "ERROR: install git-filter-repo first"; exit 1; }

echo "== 1/5 safety backup bundle =="
git bundle create ../ufologist-backup-$(git rev-parse --short HEAD).bundle --all

echo "== 2/5 stop versioning artefacts =="
{ printf '\n# build/deploy artefacts & raw sources (see tools/repo-slim.sh)\n';
  printf 'preview/\ndata/sources/\ndata/normalized/\n'; } >> .gitignore
git rm -r --cached --ignore-unmatch preview data/sources data/normalized >/dev/null 2>&1 || true
git add .gitignore
git commit -m "chore: stop versioning preview snapshots and raw sources" || true

echo "== 3/5 purge from history =="
git filter-repo --force \
  --path preview --path data/sources --path data/normalized --path assets/audio \
  --invert-paths

echo "== 4/5 LFS + repack =="
if command -v git-lfs >/dev/null 2>&1; then git lfs prune || true; fi
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "== 5/5 sizes after =="
du -sh .git 2>/dev/null || true
echo
echo "Review, then force-push in your maintenance window:"
echo "    git push --force-with-lease origin main"
echo "Everyone else must re-clone."
