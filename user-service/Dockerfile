FROM node:22-slim

WORKDIR /app

# Toolchain para módulos nativos (better-sqlite3)
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3002

CMD ["node", "src/index.js"]
