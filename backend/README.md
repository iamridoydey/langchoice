# Backend — Go Gin REST API

The LangChoice backend is a Go HTTP server built with the Gin framework. It connects to MongoDB and exposes a JSON API consumed by the Next.js frontend.

## Tech

- Go 1.26
- [Gin](https://github.com/gin-gonic/gin) v1.12 — HTTP framework
- [mongo-driver v2](https://github.com/mongodb/mongo-go-driver) — MongoDB client
- [godotenv](https://github.com/joho/godotenv) — loads `.env` locally

## Structure

```
backend/
├── main.go           Entry point — env config, DB connect, router setup, CORS
├── handlers/
│   └── handlers.go   HTTP handler functions for each route
├── models/
│   └── models.go     Structs: Language, Vote, VoteRequest, LeaderboardEntry
├── store/
│   └── store.go      MongoDB connection + seed data on first run
├── Dockerfile        Multi-stage build → ~12MB scratch image
└── .env.example      Template for local environment variables
```

## API routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check — returns `{"status":"ok"}` |
| GET | `/api/languages` | List all 8 languages |
| POST | `/api/vote` | Cast a vote `{lang_slug, username, comment}` |
| GET | `/api/votes/:lang` | Get recent votes for a language |
| GET | `/api/leaderboard` | Rankings with vote counts |

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `DB_NAME` | `langchoice` | Database name |
| `PORT` | `5000` | Port to listen on |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
```

## Running locally

```bash
# Make sure MongoDB is running locally first
go run main.go

# Server starts on :5000
# Test the health endpoint
curl http://localhost:5000/api/health
```

## Docker build

```bash
docker build -t langchoice-backend .
docker run -p 5000:5000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017 \
  langchoice-backend
```

The Dockerfile uses a two-stage build. Stage 1 compiles the Go binary with `CGO_ENABLED=0` producing a fully static binary. Stage 2 uses `scratch` — the final image contains only the binary, TLS certificates, and timezone data. Final image size is around 12MB.

## CORS

`ALLOWED_ORIGINS` accepts a single value or a comma-separated list:

```
ALLOWED_ORIGINS=https://langchoice.com
ALLOWED_ORIGINS=https://langchoice.com, https://www.langchoice.com, http://localhost:3000
```

The backend parses this at startup and passes the full list to `gin-contrib/cors`. Each incoming request is checked against the list and only the matching origin is echoed back.

## MongoDB seed data

On first connection, `store.go` checks if the `languages` collection is empty. If it is, it inserts 8 default languages (Go, Rust, TypeScript, Python, Kotlin, Swift, Elixir, Zig). This only runs once — on subsequent starts it does nothing.