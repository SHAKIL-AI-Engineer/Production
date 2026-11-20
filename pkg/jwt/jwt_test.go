package jwt

import (
	"testing"
	"time"
)

func TestAccessTokenAndParse(t *testing.T) {
	mgr := NewManager("test-super-secret-key-1234567890")

	tokenStr, err := mgr.AccessToken("user-1", "user@example.com", "admin", time.Minute*5)
	if err != nil {
		t.Fatalf("unexpected error creating token: %v", err)
	}

	claims, err := mgr.Parse(tokenStr)
	if err != nil {
		t.Fatalf("unexpected error parsing token: %v", err)
	}

	if claims.UserID != "user-1" {
		t.Errorf("expected UserID user-1, got %s", claims.UserID)
	}
	if claims.Email != "user@example.com" {
		t.Errorf("expected Email user@example.com, got %s", claims.Email)
	}
	if claims.Role != "admin" {
		t.Errorf("expected Role admin, got %s", claims.Role)
	}
}

func TestExpiredToken(t *testing.T) {
	mgr := NewManager("test-super-secret-key-1234567890")

	// Token expired 1 second ago
	tokenStr, err := mgr.AccessToken("user-1", "user@example.com", "user", -time.Second)
	if err != nil {
		t.Fatalf("unexpected error creating token: %v", err)
	}

	_, err = mgr.Parse(tokenStr)
	if err == nil {
		t.Error("expected error parsing expired token, got nil")
	}
}

func TestExtractBearerToken(t *testing.T) {
	cases := []struct {
		header   string
		expected string
		ok       bool
	}{
		{"Bearer abc123xyz", "abc123xyz", true},
		{"Bearer ", "", true},
		{"Basic abc", "", false},
		{"", "", false},
		{"Bearer", "", false},
	}

	for _, tc := range cases {
		tok, ok := ExtractBearerToken(tc.header)
		if ok != tc.ok || tok != tc.expected {
			t.Errorf("ExtractBearerToken(%q) = (%q, %v), want (%q, %v)", tc.header, tok, ok, tc.expected, tc.ok)
		}
	}
}
