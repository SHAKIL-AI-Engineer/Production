package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"production-report-api/internal/config"
	"production-report-api/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// New opens a database connection based on config and runs auto-migration.
// Supports both PostgreSQL and pure-Go SQLite (no CGO required).
func New(cfg *config.Config) (*gorm.DB, error) {
	var dialector gorm.Dialector

	switch cfg.DBDriver {
	case "postgres":
		dsn := cfg.DatabaseURL
		if dsn == "" {
			dsn = fmt.Sprintf(
				"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
				cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort,
			)
		}
		dialector = postgres.Open(dsn)
	case "sqlite":
		if dir := filepath.Dir(cfg.DBPath); dir != "" && dir != "." {
			if err := os.MkdirAll(dir, 0755); err != nil {
				return nil, fmt.Errorf("failed to create sqlite directory %s: %w", dir, err)
			}
		}
		dialector = sqlite.Open(cfg.DBPath)
	default:
		return nil, fmt.Errorf("unsupported DB_DRIVER: %s", cfg.DBDriver)
	}

	db, err := gorm.Open(dialector, &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := db.AutoMigrate(
		&models.User{},
		&models.DailyProduction{},
		&models.DailyExpense{},
	); err != nil {
		return nil, fmt.Errorf("auto-migration failed: %w", err)
	}

	log.Printf("Database connected (driver=%s)", cfg.DBDriver)
	return db, nil
}
