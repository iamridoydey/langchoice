package main

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/iamridoydey/langchoice/backend/handlers"
	"github.com/iamridoydey/langchoice/backend/store"
	"github.com/joho/godotenv"
)

// parseOrigins splits a comma-separated origin string and trims whitespace.
// Input:  "https://langchoice.com, https://www.langchoice.com , http://localhost:3000"
// Output: ["https://langchoice.com", "https://www.langchoice.com", "http://localhost:3000"]
func parseOrigins(raw string) []string {
	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			origins = append(origins, trimmed)
		}
	}
	return origins
}

func main() {
	// ── 1. Load env vars ────────────────────────────────────────────────────
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// ── 2. Read config from env ─────────────────────────────────────────────
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017"
	}

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "langchoice"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	rawOrigins := os.Getenv("ALLOWED_ORIGINS")
	if rawOrigins == "" {
		rawOrigins = "http://localhost:3000"
	}
	allowedOrigins := parseOrigins(rawOrigins)
	log.Printf("CORS allowed origins: %v", allowedOrigins)

	// ── 3. Connect to MongoDB ───────────────────────────────────────────────
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db, err := store.Connect(ctx, mongoURI, dbName)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer db.Disconnect()

	// ── 4. Build router ─────────────────────────────────────────────────────
	// gin.New() — no middleware attached yet, no duplicate warning
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// Trust only our VPC CIDR so X-Forwarded-For cannot be spoofed
	// by external clients. Change to match your actual VPC CIDR.
	trustedProxy := os.Getenv("VPC_CIDR")
	if trustedProxy == "" {
			trustedProxy = "0.0.0.0/0"
	}
	
	if err := r.SetTrustedProxies([]string{trustedProxy}); err != nil {
		log.Fatalf("SetTrustedProxies: %v", err)
	}

	// ── 5. CORS ─────────────────────────────────────────────────────────────
	r.Use(cors.New(cors.Config{
		AllowOrigins: allowedOrigins,
		AllowMethods: []string{"GET", "POST", "OPTIONS"},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Authorization",
			"X-Requested-With",
		},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// ── 6. Routes ────────────────────────────────────────────────────────────
	h := handlers.New(db)

	api := r.Group("/api")
	{
		api.GET("/health",       h.Health)
		api.GET("/languages",    h.GetLanguages)
		api.POST("/vote",        h.CastVote)
		api.GET("/votes/:lang",  h.GetVotesForLanguage)
		api.GET("/leaderboard",  h.GetLeaderboard)
	}

	// ── 7. Start server ──────────────────────────────────────────────────────
	log.Printf("LangChoice backend running on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}