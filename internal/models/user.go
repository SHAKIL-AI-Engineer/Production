package models

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Role constants
const (
	RoleAdmin  = "admin"
	RoleManager = "manager"
	RoleUser   = "user"
)

// User represents an application user with authentication and RBAC.
type User struct {
	ID           string    `gorm:"type:text;primaryKey" json:"id"`
	Email        string    `gorm:"type:text;uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"type:text;not null" json:"-"`
	Role         string    `gorm:"type:text;not null;default:'user'" json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// BeforeCreate hook generates a UUID-like id if empty and hashes password.
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = newID()
	}
	if u.Role == "" {
		u.Role = RoleUser
	}
	if u.PasswordHash != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(u.PasswordHash), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.PasswordHash = string(hash)
	}
	return nil
}

// BeforeUpdate hook re-hashes password only when it changed.
func (u *User) BeforeUpdate(tx *gorm.DB) error {
	// Only hash if the PasswordHash field looks like a plaintext password
	// (bcrypt hashes start with $2a$ or $2b$).
	if u.PasswordHash != "" && !isBcryptHash(u.PasswordHash) {
		hash, err := bcrypt.GenerateFromPassword([]byte(u.PasswordHash), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.PasswordHash = string(hash)
	}
	return nil
}

// ComparePassword compares a plaintext password against the stored hash.
func (u *User) ComparePassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
}

func isBcryptHash(s string) bool {
	return len(s) >= 4 && (s[0:4] == "$2a$" || s[0:4] == "$2b$" || s[0:4] == "$2y$")
}

func newID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		// Fallback (should not happen): timestamp-based id
		return hex.EncodeToString([]byte(time.Now().UTC().String()))
	}
	return hex.EncodeToString(b)
}
