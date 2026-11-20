package services

import (
	"errors"

	"production-report-api/internal/config"
	"production-report-api/internal/models"
	"production-report-api/internal/repository"
	"production-report-api/pkg/jwt"
)

// AuthService handles user registration, login, and profile retrieval.
type AuthService struct {
	userRepo repository.UserRepository
	jwtMgr   *jwt.Manager
	cfg      *config.Config
}

// NewAuthService constructs an AuthService.
func NewAuthService(userRepo repository.UserRepository, jwtMgr *jwt.Manager, cfg *config.Config) *AuthService {
	return &AuthService{userRepo: userRepo, jwtMgr: jwtMgr, cfg: cfg}
}

// RegisterInput is the payload for user registration.
type RegisterInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"omitempty,oneof=admin manager user"`
}

// LoginInput is the payload for user login.
type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Register creates a new user. Returns error if email already exists.
func (s *AuthService) Register(in RegisterInput) (*models.User, error) {
	exists, err := s.userRepo.ExistsByEmail(in.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("email already registered")
	}

	role := in.Role
	if role == "" {
		role = models.RoleUser
	}

	user := &models.User{
		Email:        in.Email,
		PasswordHash: in.Password, // hashed by BeforeCreate hook
		Role:         role,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}
	// Clear hash from returned user
	user.PasswordHash = ""
	return user, nil
}

// Login verifies credentials and issues a JWT access token.
func (s *AuthService) Login(in LoginInput) (*models.User, string, error) {
	user, err := s.userRepo.FindByEmail(in.Email)
	if err != nil {
		return nil, "", errors.New("invalid credentials")
	}
	if err := user.ComparePassword(in.Password); err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	token, err := s.jwtMgr.AccessToken(user.ID, user.Email, user.Role, s.cfg.JWTAccessExpiry)
	if err != nil {
		return nil, "", err
	}

	user.PasswordHash = ""
	return user, token, nil
}

// Me returns the user by ID with sensitive fields stripped.
func (s *AuthService) Me(userID string) (*models.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}
	user.PasswordHash = ""
	return user, nil
}

// AccessExpirySeconds returns the access token TTL in seconds.
func (s *AuthService) AccessExpirySeconds() int64 {
	return int64(s.cfg.JWTAccessExpiry.Seconds())
}


