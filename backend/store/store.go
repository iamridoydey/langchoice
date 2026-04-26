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
	// mongo.Connect in v2 no longer takes a context — timeout is
	// controlled via the URI (connectTimeoutMS) or ServerAPIOptions.
	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}

	// Ping uses the caller's context so the timeout is respected.
	if err := client.Ping(ctx, nil); err != nil {
		_ = client.Disconnect(ctx)
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

// defaultLanguages is the canonical seed list.
// Slugs use URL-safe strings only — no special characters.
var defaultLanguages = []bson.M{
	{"slug": "go",         "name": "Go",         "color": "#00ADD8", "description": "Compiled, statically typed, fast and concurrent"},
	{"slug": "rust",       "name": "Rust",        "color": "#CE422B", "description": "Memory safe, high performance, no garbage collector"},
	{"slug": "typescript", "name": "TypeScript",  "color": "#3178C6", "description": "JavaScript with static typing"},
	{"slug": "javascript", "name": "JavaScript",  "color": "#F7DF1E", "description": "The language of the web"},
	{"slug": "python",     "name": "Python",      "color": "#3776AB", "description": "Simple, readable, versatile"},
	{"slug": "java",       "name": "Java",        "color": "#ED8B00", "description": "Enterprise-grade, JVM-based language"},
	{"slug": "csharp",     "name": "C#",          "color": "#239120", "description": "Modern language for the .NET ecosystem"},
	{"slug": "cpp",        "name": "C++",         "color": "#00599C", "description": "High-performance systems programming"},
	{"slug": "c",          "name": "C",           "color": "#A8B9CC", "description": "Low-level, powerful systems language"},
	{"slug": "kotlin",     "name": "Kotlin",      "color": "#7F52FF", "description": "Modern JVM language by JetBrains"},
	{"slug": "swift",      "name": "Swift",       "color": "#FA7343", "description": "Powerful language for Apple platforms"},
	{"slug": "dart",       "name": "Dart",        "color": "#0175C2", "description": "Optimized for UI, used with Flutter"},
	{"slug": "php",        "name": "PHP",         "color": "#777BB4", "description": "Popular server-side scripting language"},
	{"slug": "ruby",       "name": "Ruby",        "color": "#CC342D", "description": "Elegant language focused on productivity"},
	{"slug": "elixir",     "name": "Elixir",      "color": "#6E4A7E", "description": "Functional, scalable, fault-tolerant"},
	{"slug": "scala",      "name": "Scala",       "color": "#DC322F", "description": "Functional and object-oriented on JVM"},
	{"slug": "haskell",    "name": "Haskell",     "color": "#5D4F85", "description": "Pure functional programming language"},
	{"slug": "zig",        "name": "Zig",         "color": "#F7A41D", "description": "Low-level, simple, and predictable"},
	{"slug": "bash",       "name": "Bash",        "color": "#4EAA25", "description": "Shell scripting for automation"},
	{"slug": "sql",        "name": "SQL",         "color": "#336791", "description": "Language for managing relational databases"},
}

// seed upserts the default language list into the languages collection.
// It is safe to call on every startup — existing documents are updated,
// new ones are inserted. No data is lost.
func (db *DB) seed(ctx context.Context) error {
	models := make([]mongo.WriteModel, 0, len(defaultLanguages))

	for _, lang := range defaultLanguages {
		model := mongo.NewUpdateOneModel().
			SetFilter(bson.M{"slug": lang["slug"]}).
			SetUpdate(bson.M{
				"$set": bson.M{
					"name":        lang["name"],
					"color":       lang["color"],
					"description": lang["description"],
				},
			}).
			SetUpsert(true)

		models = append(models, model)
	}

	// Ordered: false — if one upsert fails the rest still run.
	opts := options.BulkWrite().SetOrdered(false)

	// Use = not := so err is not shadowed — it is declared by the
	// function signature's named return or the caller checks the return.
	_, err := db.Languages.BulkWrite(ctx, models, opts)
	return err
}