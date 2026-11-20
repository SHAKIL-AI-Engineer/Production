package config

import (
	"os"
	"reflect"
	"testing"
)

func TestSplitEnv(t *testing.T) {
	cases := []struct {
		envVal   string
		fallback string
		expected []string
	}{
		{"http://a.com, http://b.com", "http://c.com", []string{"http://a.com", "http://b.com"}},
		{"", "http://c.com, http://d.com", []string{"http://c.com", "http://d.com"}},
		{"http://single.com", "http://c.com", []string{"http://single.com"}},
	}

	for _, tc := range cases {
		os.Setenv("TEST_SPLIT_ENV", tc.envVal)
		res := splitEnv("TEST_SPLIT_ENV", tc.fallback)
		if !reflect.DeepEqual(res, tc.expected) {
			t.Errorf("splitEnv with env=%q, def=%q: got %v, want %v", tc.envVal, tc.fallback, res, tc.expected)
		}
	}
	os.Unsetenv("TEST_SPLIT_ENV")
}

func TestLoadDefaults(t *testing.T) {
	cfg := Load()
	if cfg.AppPort == "" {
		t.Error("expected default AppPort to be non-empty")
	}
	if cfg.DBDriver == "" {
		t.Error("expected default DBDriver to be non-empty")
	}
}

func TestHostedPortAndDatabaseURL(t *testing.T) {
	t.Setenv("PORT", "4242")
	t.Setenv("APP_PORT", "8080")
	t.Setenv("DB_DRIVER", "sqlite")
	t.Setenv("DATABASE_URL", "postgresql://test:test@localhost/test?sslmode=require")
	cfg := Load()
	if cfg.AppPort != "4242" {
		t.Fatalf("host-assigned PORT must take precedence; got %s", cfg.AppPort)
	}
	if cfg.DBDriver != "postgres" || cfg.DatabaseURL == "" {
		t.Fatal("a PostgreSQL connection URL must select the postgres driver")
	}
}

func TestPostgresURLFallback(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("POSTGRES_URL", "postgresql://test:test@localhost/test?sslmode=require")
	if cfg := Load(); cfg.DatabaseURL != os.Getenv("POSTGRES_URL") {
		t.Fatal("POSTGRES_URL must be accepted for Marketplace integrations")
	}
}
