# Development image for the React dev server. See compose.yml at the repo root.
#
# This runs `react-scripts start`, not a production build. A deployed frontend is
# a `npm run build` static bundle served by a real web server — that is what
# .gitlab-ci.yml does, and it does not use this file.
#
# Node version matches .gitlab-ci.yml so local and CI agree.
FROM node:22.18.0-bookworm-slim

# Create the workdir as root and hand it over, before dropping privileges.
RUN mkdir -p /app && chown node:node /app
WORKDIR /app

# The node image ships a non-root "node" user but does not select it, so
# without this line everything below would run as root.
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

EXPOSE 3000

CMD ["npm", "start"]