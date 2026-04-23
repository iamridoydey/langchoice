package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/langchoice/backend/models"
	"github.com/langchoice/backend/store"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type Handler struct {
	db *store.DB
}

func New(db *store.DB) *Handler {
	return &Handler{db: db}
}

func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "langchoice-backend"})
}

func (h *Handler) GetLanguages(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := h.db.Languages.Find(ctx, bson.D{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch languages"})
		return
	}
	defer cursor.Close(ctx)

	var langs []models.Language
	if err := cursor.All(ctx, &langs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode languages"})
		return
	}

	c.JSON(http.StatusOK, langs)
}

func (h *Handler) CastVote(c *gin.Context) {
	var req models.VoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Verify language exists
	var lang models.Language
	err := h.db.Languages.FindOne(ctx, bson.M{"slug": req.LangSlug}).Decode(&lang)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Language not found"})
		return
	}

	vote := models.Vote{
		LangSlug:  req.LangSlug,
		Username:  req.Username,
		Comment:   req.Comment,
		CreatedAt: time.Now().UTC(),
	}

	result, err := h.db.Votes.InsertOne(ctx, vote)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cast vote"})
		return
	}

	vote.ID = result.InsertedID.(bson.ObjectID)
	c.JSON(http.StatusCreated, vote)
}

func (h *Handler) GetVotesForLanguage(c *gin.Context) {
	slug := c.Param("lang")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Sort by most recent
	opts := bson.D{{Key: "$sort", Value: bson.D{{Key: "created_at", Value: -1}}}}
	limitOpts := bson.D{{Key: "$limit", Value: int64(50)}}

	cursor, err := h.db.Votes.Aggregate(ctx, bson.A{
		bson.D{{Key: "$match", Value: bson.M{"lang_slug": slug}}},
		opts,
		limitOpts,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch votes"})
		return
	}
	defer cursor.Close(ctx)

	var votes []models.Vote
	if err := cursor.All(ctx, &votes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode votes"})
		return
	}
	if votes == nil {
		votes = []models.Vote{}
	}

	c.JSON(http.StatusOK, votes)
}

func (h *Handler) GetLeaderboard(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pipeline := bson.A{
		bson.D{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$lang_slug"},
			{Key: "vote_count", Value: bson.D{{Key: "$sum", Value: 1}}},
		}}},
		bson.D{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "languages"},
			{Key: "localField", Value: "_id"},
			{Key: "foreignField", Value: "slug"},
			{Key: "as", Value: "lang_info"},
		}}},
		bson.D{{Key: "$unwind", Value: "$lang_info"}},
		bson.D{{Key: "$project", Value: bson.D{
			{Key: "_id", Value: 1},
			{Key: "vote_count", Value: 1},
			{Key: "name", Value: "$lang_info.name"},
			{Key: "color", Value: "$lang_info.color"},
			{Key: "description", Value: "$lang_info.description"},
		}}},
		bson.D{{Key: "$sort", Value: bson.D{{Key: "vote_count", Value: -1}}}},
	}

	cursor, err := h.db.Votes.Aggregate(ctx, pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to build leaderboard"})
		return
	}
	defer cursor.Close(ctx)

	var entries []models.LeaderboardEntry
	if err := cursor.All(ctx, &entries); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode leaderboard"})
		return
	}
	if entries == nil {
		entries = []models.LeaderboardEntry{}
	}

	c.JSON(http.StatusOK, entries)
}