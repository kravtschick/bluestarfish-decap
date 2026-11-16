#!/usr/bin/env bash
# Builds the staging branch and publishes it to the staging web server.
#
#   deploy.sh               build and publish the latest commit
#   deploy.sh --if-changed  do nothing when that commit is already live (for cron)
#
# Settings (override with environment variables):
#   STAGING_REPO    Git URL to build from
#   STAGING_BRANCH  branch to build
#   STAGING_HOME    where the source checkout and compose files live
#   STAGING_WWW     where built releases are stored (mounted into nginx)
#   STAGING_DOCKER_OPTS  extra options for the build container (e.g. "--memory 2g")

main() {
  set -euo pipefail

  local repo="${STAGING_REPO:-https://github.com/kravtschick/bluestarfish-decap.git}"
  local branch="${STAGING_BRANCH:-staging}"
  local home="${STAGING_HOME:-/root/docker/bluestarfish-staging}"
  local www="${STAGING_WWW:-/root/docker/volumes/bluestarfish-staging/www}"
  local src="$home/src"
  local keep=3
  local if_changed=false
  [[ "${1:-}" == "--if-changed" ]] && if_changed=true

  log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*"; }

  exec 9>"$home/.deploy.lock"
  if ! flock -n 9; then
    log "Another deploy is running. Skipping."
    return 0
  fi

  if [[ ! -d "$src/.git" ]]; then
    log "Cloning $branch from $repo"
    git clone --branch "$branch" --depth 1 "$repo" "$src"
  else
    log "Fetching $branch from $(git -C "$src" remote get-url origin)"
    git -C "$src" fetch --depth 1 origin "$branch"
    git -C "$src" reset --hard FETCH_HEAD
    git -C "$src" clean -fdx -e node_modules -e .astro-cache
  fi
  local commit
  commit="$(git -C "$src" rev-parse --short HEAD)"

  if $if_changed && [[ -f "$www/current/.commit" ]] \
     && [[ "$(cat "$www/current/.commit")" == "$commit" ]]; then
    log "Commit $commit is already live. Nothing to do."
    return 0
  fi

  log "Building $commit"
  # shellcheck disable=SC2086
  docker run --rm ${STAGING_DOCKER_OPTS:-} \
    -v "$src":/app -w /app \
    -v bluestarfish-staging-npm:/root/.npm \
    -e PUBLIC_SITE_ENV=staging \
    node:20-bookworm-slim \
    sh -c "npm ci --no-audit --no-fund && npx astro build"

  local release
  release="$(date +%Y%m%d-%H%M%S)-$commit"
  mkdir -p "$www/releases"
  cp -a "$src/dist" "$www/releases/$release"

  # Staging only: block all crawlers and drop the CMS.
  printf 'User-agent: *\nDisallow: /\n' > "$www/releases/$release/robots.txt"
  rm -rf "$www/releases/$release/admin"
  echo "$commit" > "$www/releases/$release/.commit"

  # Switch atomically. The link is relative so it also resolves inside nginx.
  ln -sfn "releases/$release" "$www/current.tmp"
  mv -T "$www/current.tmp" "$www/current"
  log "Live: $release"

  # Keep the newest releases only.
  ls -1dt "$www"/releases/*/ | tail -n +$((keep + 1)) | xargs -r rm -rf

  # Smoke test straight against the container, bypassing Caddy's password.
  local path expected code failed=0
  while read -r path expected; do
    code="$(docker exec bluestarfish-staging \
      curl -s -o /dev/null -w '%{http_code}' "http://localhost$path" || true)"
    if [[ "$code" == "$expected" ]]; then
      log "  ok    $path -> $code"
    else
      log "  FAIL  $path -> ${code:-no answer} (expected $expected)"
      failed=1
    fi
  done <<'CHECKS'
/ 301
/en 301
/en/ 200
/pl/ 200
/pl/kraje/wietnam/ 200
/pl/nie-ma/ 404
/robots.txt 200
CHECKS
  return "$failed"
}

main "$@"
exit $?
