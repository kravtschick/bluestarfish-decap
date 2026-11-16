#!/usr/bin/env bash
# One-time setup of the Blue Starfish staging site on this server.
# Run as root from the repository checkout:
#   bash /root/docker/bluestarfish-staging/src/deploy/staging/setup.sh
#
# What it does:
#   1. starts the nginx container "bluestarfish-staging" on the caddy network
#   2. adds a password-protected site block for $STAGING_HOST to the Caddyfile
#      (backup first, validated before reload, restored if validation fails)
#   3. runs the first deploy
#
# It does not restart Caddy and does not touch any other service.

main() {
  set -euo pipefail

  local host="${STAGING_HOST:-bluestarfish-staging.apps.nebuno.com}"
  local home="${STAGING_HOME:-/root/docker/bluestarfish-staging}"
  local www="${STAGING_WWW:-/root/docker/volumes/bluestarfish-staging/www}"
  local caddy="${CADDY_CONTAINER:-docker-caddy-1}"
  local caddyfile="${CADDYFILE:-/root/docker/volumes/caddy_config/Caddyfile}"
  local user="${STAGING_USER:-staging}"
  local here
  here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  log() { printf '\n==> %s\n' "$*"; }
  fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

  [[ $EUID -eq 0 ]] || fail "Run as root (su -)."
  command -v git >/dev/null || fail "git is missing: apt-get install -y git"
  command -v flock >/dev/null || fail "flock is missing: apt-get install -y util-linux"
  docker network inspect caddy >/dev/null 2>&1 || fail "Docker network 'caddy' not found."
  docker inspect "$caddy" >/dev/null 2>&1 || fail "Caddy container '$caddy' not found."
  [[ -f "$caddyfile" ]] || fail "Caddyfile not found at $caddyfile"

  # Where the Caddyfile appears inside the Caddy container.
  local inner
  inner="$(docker inspect "$caddy" --format '{{range .Mounts}}{{.Source}}|{{.Destination}}{{"\n"}}{{end}}' \
    | awk -F'|' -v f="$caddyfile" '
        $1 == f { print $2; exit }
        index(f, $1 "/") == 1 { print $2 substr(f, length($1) + 1); exit }')"
  [[ -n "$inner" ]] || fail "Could not find $caddyfile among the mounts of $caddy."

  log "Starting the web container"
  mkdir -p "$www/releases"
  cp "$here/docker-compose.yml" "$here/nginx.conf" "$home/"
  (cd "$home" && STAGING_WWW="$www" docker compose up -d)

  if grep -q "^$host" "$caddyfile"; then
    log "Caddy already has a block for $host. Leaving the Caddyfile unchanged."
  else
    log "Choose a password for $host (user: $user)"
    local pass pass2 hash
    read -rsp "Password: " pass; echo
    read -rsp "Repeat:   " pass2; echo
    [[ -n "$pass" && "$pass" == "$pass2" ]] || fail "Passwords are empty or do not match."
    hash="$(docker exec "$caddy" caddy hash-password --plaintext "$pass")"
    unset pass pass2

    # basic_auth replaced basicauth in Caddy 2.8.
    local directive="basicauth" ver
    ver="$(docker exec "$caddy" caddy version | grep -oE '^v?[0-9]+\.[0-9]+' | tr -d v)"
    if [[ "$(printf '%s\n2.8\n' "$ver" | sort -V | head -1)" == "2.8" ]]; then
      directive="basic_auth"
    fi

    local backup
    backup="$caddyfile.bak-$(date +%Y%m%d-%H%M%S)"
    cp -a "$caddyfile" "$backup"
    log "Caddyfile backed up to $backup"

    cat >> "$caddyfile" <<EOF

# Blue Starfish Travel staging (added by deploy/staging/setup.sh)
$host {
	$directive {
		$user $hash
	}
	reverse_proxy bluestarfish-staging:80
}
EOF

    if ! docker exec "$caddy" caddy validate --config "$inner" --adapter caddyfile >/tmp/caddy-validate.log 2>&1; then
      cp -a "$backup" "$caddyfile"
      cat /tmp/caddy-validate.log >&2
      fail "Caddy rejected the new config. The original Caddyfile is restored."
    fi
    if ! docker exec "$caddy" caddy reload --config "$inner" --adapter caddyfile; then
      fail "The new config is valid but Caddy did not reload (admin API off?).
Run 'docker restart $caddy' (a few seconds of downtime for all sites), then run this script again."
    fi
    log "Caddy reloaded"
  fi

  log "First deploy"
  bash "$here/deploy.sh"

  log "Done. Open https://$host/ and sign in as '$user'."
  cat <<EOF

To redeploy after a push to the staging branch:
  bash $home/src/deploy/staging/deploy.sh

To redeploy automatically every 10 minutes when the branch changes, add this
line with 'crontab -e':
  */10 * * * * bash $home/src/deploy/staging/deploy.sh --if-changed >> /var/log/bluestarfish-staging.log 2>&1
EOF
}

main "$@"
exit $?
