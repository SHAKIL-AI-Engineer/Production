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
