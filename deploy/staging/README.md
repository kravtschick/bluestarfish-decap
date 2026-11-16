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

## Refreshing Google reviews

`src/data/reviews.json` holds the reviews shown on `/pl/opinie/` and
`/en/reviews/`, plus the two quotes on the About page and the rating in the
structured data. It was built from a Google Maps review export (Apify
"Google Maps Reviews Scraper") on 16 Nov 2026. To refresh: export again,
regenerate the JSON with the same fields (name per language, date, stars, lang, trip,
text per language, photos, reviewUrl), copy new guest photos to
`src/assets/images/reviews/` at about 1200 px, and update `reviewCount`.

## Enquiry form (EmailJS template)

`TripPlannerForm.astro` posts these variables to the EmailJS template
`template_8sqboo9` on service `service_j0gcq1f`: `destinations` (repeated),
`month`, `duration`, `party`, `budget`, `notes`, `name`, `email`, `phone`,
`lang`, `source_page`. Update the template to show them and set Reply-To
to `{{email}}`. The honeypot field is `contact_number`; add it to the
template's block list in the EmailJS dashboard if spam appears.
