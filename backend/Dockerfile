# ───────────────────────────────
# Stage 1 — Builder
# ───────────────────────────────
FROM golang:1.26-alpine AS builder

# Install basic tools
RUN apk add --no-cache git ca-certificates tzdata

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum first (better caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the Go binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -o backend .

# ───────────────────────────────
# Stage 2 — Runner
# ───────────────────────────────
FROM scratch

# Copy certificates and timezone data
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy the compiled binary
COPY --from=builder /app/backend /backend

# Expose port
EXPOSE 5000

# Run the binary
ENTRYPOINT ["/backend"]
