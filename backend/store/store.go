package store

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type DB struct {
	client    *mongo.Client
	Languages *mongo.Collection
	Votes     *mongo.Collection
}

func Connect(ctx context.Context, uri, dbName string) (*DB, error) {
	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}

	if err := client.Ping(ctx, nil); err != nil {
		return nil, err
	}

	database := client.Database(dbName)
	db := &DB{
		client:    client,
		Languages: database.Collection("languages"),
		Votes:     database.Collection("votes"),
	}

	if err := db.seed(ctx); err != nil {
		return nil, err
	}

	return db, nil
}

func (db *DB) Disconnect() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = db.client.Disconnect(ctx)
}

// seed inserts default languages if none exist
func (db *DB) seed(ctx context.Context) error {
	count, err := db.Languages.CountDocuments(ctx, bson.D{})
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	langs := []interface{}{
		bson.M{"slug": "go", "name": "Go", "color": "#00ADD8", "description": "Compiled, statically typed, garbage collected"},
		bson.M{"slug": "rust", "name": "Rust", "color": "#CE422B", "description": "Memory safe, blazingly fast, no GC"},
		bson.M{"slug": "typescript", "name": "TypeScript", "color": "#3178C6", "description": "JavaScript with static types"},
		bson.M{"slug": "python", "name": "Python", "color": "#3776AB", "description": "Simple, readable, batteries included"},
		bson.M{"slug": "kotlin", "name": "Kotlin", "color": "#7F52FF", "description": "Modern JVM language by JetBrains"},
		bson.M{"slug": "swift", "name": "Swift", "color": "#FA7343", "description": "Apple's powerful open-source language"},
		bson.M{"slug": "elixir", "name": "Elixir", "color": "#6E4A7E", "description": "Functional, concurrent, fault-tolerant"},
		bson.M{"slug": "zig", "name": "Zig", "color": "#F7A41D", "description": "General-purpose, comptime-focused"},
	}

	_, err = db.Languages.InsertMany(ctx, langs)
	return err
}