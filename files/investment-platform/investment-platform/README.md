# Investment Platform API — Backend Nest.js

Backend généré à partir du cahier des charges "Plateforme d'Investissement
Intelligente (SaaS)" v1.0. Couvre les modules `auth`, `users`, `profiles`,
`market` (Finnhub) et `ai` (Claude / Anthropic).

## 📁 Structure

```
src/
  app.module.ts          # module racine, assemble tout
  main.ts                 # bootstrap (ValidationPipe, CORS, prefix /api)
  prisma/
    prisma.service.ts     # client Prisma injectable
  auth/                   # JWT + refresh token
    auth.module.ts
    auth.controller.ts    # POST /api/auth/register|login|refresh|logout
    auth.service.ts
    dto/auth.dto.ts
    strategies/jwt.strategy.ts
    guards/jwt-auth.guard.ts
  users/                  # gestion des comptes
    users.module.ts
    users.controller.ts   # POST /api/users, GET /api/users/:id
    users.service.ts      # hashing bcrypt du mot de passe
    dto/create-user.dto.ts
  profiles/               # questionnaire + scoring de risque
    profiles.module.ts
    profiles.controller.ts # GET /api/profiles/questions, POST /api/profiles/questionnaire, GET /api/profiles/me
    profiles.service.ts    # calcul du score pondéré + attribution du profil
    dto/submit-questionnaire.dto.ts
  market/                 # intégration Finnhub
    market.module.ts
    market.controller.ts  # GET /api/market/quote/:symbol, /sentiment/:symbol, /news
    market.service.ts     # logique de cache PostgreSQL (MarketDataCache)
    finnhub.service.ts    # appels HTTP bruts à l'API Finnhub
    dto/
  ai/                      # module IA générative (Claude)
    ai.module.ts
    ai.controller.ts      # POST /api/ai/recommendation, POST /api/ai/ask
    ai.service.ts         # orchestration profil + Finnhub + Claude
    claude.service.ts     # wrapper SDK Anthropic
    dto/
prisma/
  schema.prisma            # schéma complet (User, InvestmentProfile, Question, Answer, Watchlist, MarketDataCache, RefreshToken)
  seed.ts                  # peuple les 12 questions du questionnaire
.env.example
package.json
```

## 🔗 Dépendances entre modules

```
AppModule
 ├── AuthModule ──────► UsersModule
 ├── UsersModule
 ├── ProfilesModule ──► AuthModule (JwtAuthGuard)
 ├── MarketModule ────► AuthModule (JwtAuthGuard)
 └── AiModule ────────► MarketModule (données Finnhub)
                    └──► AuthModule (JwtAuthGuard)
```

## ▶️ Mise en route

```bash
npm install
cp .env.example .env
# éditer .env : DATABASE_URL, FINNHUB_API_KEY, ANTHROPIC_API_KEY, JWT_SECRET

npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts   # peuple les 12 questions

npm run start:dev
# API disponible sur http://localhost:4000/api
```

## 🔑 Flux d'authentification

1. `POST /api/auth/register` `{ email, password }` → `{ accessToken, refreshToken }`
2. `POST /api/auth/login` → idem
3. Toutes les routes protégées attendent `Authorization: Bearer <accessToken>`
4. `POST /api/auth/refresh` `{ refreshToken }` → nouveau couple de tokens (rotation)
5. `POST /api/auth/logout` (protégé) → invalide le refresh token en base

## 🧭 Parcours type (section 7 du cahier des charges)

1. `POST /api/auth/register`
2. `GET /api/profiles/questions` puis `POST /api/profiles/questionnaire`
3. Le profil est retourné immédiatement (type, score, tolérance, horizon)
4. `GET /api/market/quote/:symbol` et `/api/market/sentiment/:symbol` pour le dashboard
5. `POST /api/ai/ask` pour poser une question libre
6. `POST /api/ai/recommendation` `{ symbol }` pour une recommandation IA contextualisée au profil

## ⚠️ À faire avant la prod

- Remplacer les clés `.env` par de vraies clés secrètes (ne jamais commit `.env`)
- Ajouter rate limiting global (ex: `@nestjs/throttler`), mentionné en section 9
- Ajouter les tests (non générés ici)
- Le front Next.js (section 5) consomme cette API via `FRONTEND_URL` autorisé en CORS
