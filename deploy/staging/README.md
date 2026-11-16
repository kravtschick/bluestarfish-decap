# Staging site

Password-protected copy of the site at https://bluestarfish-staging.apps.nebuno.com,
built from the `staging` branch and served on the Hetzner server behind the
existing Caddy.

- `docker-compose.yml`: nginx container `bluestarfish-staging` on the `caddy` network
- `nginx.conf`: same URL rules as Netlify production (`public/_redirects` and Pretty URLs)
- `setup.sh`: one-time setup (container, Caddy site block with basic auth, first deploy)
- `deploy.sh`: build the branch in a Node container and switch to the new release

Staging builds set `PUBLIC_SITE_ENV=staging`, which adds `noindex`, removes
Google Analytics and the Netlify Identity widget, and `deploy.sh` replaces
`robots.txt` with `Disallow: /` and removes `/admin`.

## First time (as root on the server)

    git clone --branch staging https://github.com/kravtschick/bluestarfish-decap.git \
      /root/docker/bluestarfish-staging/src
    bash /root/docker/bluestarfish-staging/src/deploy/staging/setup.sh

## After each push to `staging`

    bash /root/docker/bluestarfish-staging/src/deploy/staging/deploy.sh

Or deploy automatically every 10 minutes when the branch changes (`crontab -e`):

    */10 * * * * bash /root/docker/bluestarfish-staging/src/deploy/staging/deploy.sh --if-changed >> /var/log/bluestarfish-staging.log 2>&1

## Roll back

Releases are kept in `/root/docker/volumes/bluestarfish-staging/www/releases/` (newest 3).

    cd /root/docker/volumes/bluestarfish-staging/www
    ln -sfn releases/<older-release> current.tmp && mv -T current.tmp current

## Remove staging

    cd /root/docker/bluestarfish-staging && docker compose down
    # then delete the "bluestarfish-staging.apps.nebuno.com { ... }" block from
    # /root/docker/volumes/caddy_config/Caddyfile and reload Caddy:
    docker exec docker-caddy-1 caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
