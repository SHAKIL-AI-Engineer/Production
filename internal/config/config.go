package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	AppEnv  string
	AppPort string
	BaseURL string

	DBDriver    string
	DBHost      string
	DBPort      string
	DBUser      string
	DBPassword  string
	DBName      string
	DBPath      string
	DatabaseURL string

	JWTSecret        string
	JWTAccessExpiry  time.Duration
	JWTRefreshExpiry time.Duration

	CORSAllowedOrigins []string
}

// Load reads .env and environment variables and returns a populated Config.
func Load() *Config {
	_ = godotenv.Load() // ignore error; env may be set externally

	cfg := &Config{
		AppEnv:  getEnv("APP_ENV", "development"),
		AppPort: getEnv("PORT", getEnv("APP_PORT", "8080")),
		BaseURL: getEnv("APP_BASE_URL", "http://localhost:8080"),

		DBDriver:    getEnv("DB_DRIVER", "postgres"),
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      getEnv("DB_PORT", "5432"),
		DBUser:      getEnv("DB_USER", "postgres"),
		DBPassword:  getEnv("DB_PASSWORD", "123580"),
		DBName:      getEnv("DB_NAME", "production"),
		DBPath:      getEnv("DB_PATH", "./data/production.db"),
		DatabaseURL: getEnv("DATABASE_URL", getEnv("POSTGRES_URL", "")),

		JWTSecret:        getEnv("JWT_SECRET", "change-this-in-production"),
		JWTAccessExpiry:  time.Duration(getDurationEnv("JWT_ACCESS_EXPIRY_MINUTES", 15)) * time.Minute,
		JWTRefreshExpiry: time.Duration(getDurationEnv("JWT_REFRESH_EXPIRY_HOURS", 168)) * time.Hour,

		CORSAllowedOrigins: splitEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8080"),
	}
	if cfg.DatabaseURL != "" {
		cfg.DBDriver = "postgres"
	}

	if cfg.JWTSecret == "change-this-in-production" && cfg.AppEnv == "production" {
		log.Println("WARN: JWT_SECRET is using the default value. Rotate it before production deployment.")
	}

	return cfg
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func getDurationEnv(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}

func splitEnv(key, def string) []string {
	v := os.Getenv(key)
	if v == "" {
		v = def
	}
	parts := strings.Split(v, ",")
	var out []string
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}
