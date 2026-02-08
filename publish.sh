#!/bin/sh
set -e

REPO_NAME=${1:-codex-offerwall}
BRANCH=${2:-main}

if ! command -v git >/dev/null 2>&1; then
  echo "git not found. Please install git first."
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) not found. Install from https://cli.github.com/ and run 'gh auth login' first."
  exit 1
fi

if [ ! -d .git ]; then
  git init
fi

git add .
if ! git diff --cached --quiet; then
  git commit -m "deploy: game offer wall"
fi

OWNER=$(gh api user --jq .login)
if ! gh repo view "$REPO_NAME" >/dev/null 2>&1; then
  gh repo create "$REPO_NAME" --public --source . --remote origin --push
else
  git remote add origin "https://github.com/${OWNER}/${REPO_NAME}.git" 2>/dev/null || true
  git push -u origin "$BRANCH"
fi

if ! gh api -X POST "repos/${OWNER}/${REPO_NAME}/pages" -f source[branch]="$BRANCH" -f source[path]="/" >/dev/null 2>&1; then
  gh api -X PUT "repos/${OWNER}/${REPO_NAME}/pages" -f source[branch]="$BRANCH" -f source[path]="/" >/dev/null 2>&1 || true
fi

echo ""
echo "Published. GitHub Pages URL: https://${OWNER}.github.io/${REPO_NAME}/"
