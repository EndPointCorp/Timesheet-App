# Frontend image: build the CRA bundle, serve it with nginx.
# nginx is the public entrypoint of every environment — it serves the SPA
# and reverse-proxies /api to the Rails backend (see nginx/default.conf).
#
# Stages:
#   deps    node_modules, shared by both paths below
#   dev     the React dev server, for the local compose stack
#   build   the compiled bundle
#   (last)  nginx serving that bundle
#
# The nginx stage is last on purpose: CI builds this image with a plain
# `docker build` and no --target (.gitlab-ci.yml), so the final stage is what
# previews and production get. The dev server is only reachable with
# --target dev, which nothing outside docker-compose.yml asks for.

FROM node:22.18.0-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Local development only. The source is bind-mounted over /app at run time, so
# this stage copies none of it on purpose: the image carries node_modules and
# nothing else. That is what lets several checkouts share one image and still
# each serve their own branch, and why editing a file never rebuilds it.
FROM deps AS dev

EXPOSE 3000

CMD ["npm", "start"]

FROM deps AS build

COPY . .
# Same flag the legacy CI build used; lint runs in CI, not in the image build.
ENV DISABLE_ESLINT_PLUGIN=true
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
