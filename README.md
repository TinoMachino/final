# MPV — Full Stack Project

## Estructura

```
mpv/
├── PARA/           # Frontend — React Native + Expo
├── WhatZatppa/     # Backend — AT Protocol / Node.js monorepo
└── README.md
```

## Setup

### Backend (WhatZatppa)

Requiere **Node.js 22** y **pnpm**:

```bash
cd WhatZatppa
pnpm install
make build          # genera dist/
make run-dev-env    # levanta PDS + AppView + Ozone local
```

> Si cambias de versión de Node, reconstruye `better-sqlite3`:
> ```bash
> nvm use 22
> cd node_modules/.pnpm/better-sqlite3@10.0.0/node_modules/better-sqlite3
> npx node-gyp rebuild
> ```

### Frontend (PARA)

```bash
cd PARA
pnpm install
npx expo start --web --clear
```

## Requisitos

- Node.js >= 22 (backend), >= 20 (frontend)
- pnpm >= 8
- Docker (para PostgreSQL / Redis de desarrollo)
