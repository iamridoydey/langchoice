package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Language struct {
	ID          bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Slug        string        `bson:"slug"          json:"slug"`
	Name        string        `bson:"name"          json:"name"`
	Color       string        `bson:"color"         json:"color"`
	Description string        `bson:"description"   json:"description"`
}

type Vote struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	LangSlug  string        `bson:"lang_slug"     json:"lang_slug"`
	Username  string        `bson:"username"      json:"username"`
	Comment   string        `bson:"comment"       json:"comment"`
	CreatedAt time.Time     `bson:"created_at"    json:"created_at"`
}

type VoteRequest struct {
	LangSlug string `json:"lang_slug" binding:"required"`
	Username string `json:"username"  binding:"required,min=2,max=32"`
	Comment  string `json:"comment"   binding:"required,min=1,max=280"`
}

type LeaderboardEntry struct {
	Slug        string `bson:"_id"         json:"slug"`
	Name        string `bson:"name"        json:"name"`
	Color       string `bson:"color"       json:"color"`
	Description string `bson:"description" json:"description"`
	VoteCount   int64  `bson:"vote_count"  json:"vote_count"`
}