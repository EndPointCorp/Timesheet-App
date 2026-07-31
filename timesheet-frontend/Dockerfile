# Frontend image: build the CRA bundle, serve it with nginx.
# nginx is the public entrypoint of every environment — it serves the SPA
# and reverse-proxies /api to the Rails backend (see nginx/default.conf).

FROM node:22.18.0-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# Same flag the legacy CI build used; lint runs in CI, not in the image build.
ENV DISABLE_ESLINT_PLUGIN=true
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
