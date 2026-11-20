package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
	"time"

	"production-report-api/internal/config"
	"production-report-api/internal/middleware"
	"production-report-api/internal/models"
	"production-report-api/internal/repository"
	"production-report-api/internal/services"
	"production-report-api/pkg/jwt"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func TestPublicRegistrationCannotGrantPrivilegedRoles(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, err := gorm.Open(sqlite.Open(filepath.Join(t.TempDir(), "auth.db")), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.User{}); err != nil {
		t.Fatal(err)
	}
	manager := jwt.NewManager("registration-regression-test-key")
	service := services.NewAuthService(repository.NewGormUserRepo(db), manager, &config.Config{JWTAccessExpiry: time.Hour})
	handler := NewAuthHandler(service, manager)
	router := gin.New()
	router.POST("/register", handler.Register)
	router.POST("/login", handler.Login)
	router.GET("/admin", middleware.AuthMiddleware(manager), middleware.RBACMiddleware(models.RoleAdmin, models.RoleManager), func(c *gin.Context) { c.Status(http.StatusOK) })

	request := func(path string, input map[string]string) *httptest.ResponseRecorder {
		body, err := json.Marshal(input)
		if err != nil {
			t.Fatal(err)
		}
		req := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, req)
		return recorder
	}
	for _, role := range []string{"admin", "manager"} {
		t.Run("reject "+role, func(t *testing.T) {
			email := role + "@example.test"
			response := request("/register", map[string]string{"email": email, "password": "test-password-123", "role": role})
			if response.Code != http.StatusBadRequest {
				t.Fatalf("privileged signup returned %d", response.Code)
			}
			var count int64
			db.Model(&models.User{}).Where("email = ?", email).Count(&count)
			if count != 0 {
				t.Fatal("privileged signup persisted a user")
			}
		})
	}
	for _, role := range []string{"", "user"} {
		t.Run("standard signup "+role, func(t *testing.T) {
			input := map[string]string{"email": "standard" + role + "@example.test", "password": "test-password-123"}
			if role != "" {
				input["role"] = role
			}
			registered := request("/register", input)
			if registered.Code != http.StatusCreated {
				t.Fatalf("standard signup returned %d", registered.Code)
			}
			var user models.User
			if err := json.Unmarshal(registered.Body.Bytes(), &user); err != nil {
				t.Fatal(err)
			}
			if user.Role != models.RoleUser {
				t.Fatalf("signup granted role %q", user.Role)
			}
			login := request("/login", input)
			if login.Code != http.StatusOK {
				t.Fatalf("login returned %d", login.Code)
			}
			var session struct {
				Token string `json:"token"`
			}
			if err := json.Unmarshal(login.Body.Bytes(), &session); err != nil {
				t.Fatal(err)
			}
			claims, err := manager.Parse(session.Token)
			if err != nil || claims.Role != models.RoleUser {
				t.Fatalf("JWT role is not user: %v", err)
			}
			req := httptest.NewRequest(http.MethodGet, "/admin", nil)
			req.Header.Set("Authorization", "Bearer "+session.Token)
			recorder := httptest.NewRecorder()
			router.ServeHTTP(recorder, req)
			if recorder.Code != http.StatusForbidden {
				t.Fatalf("standard user accessed privileged route: %d", recorder.Code)
			}
		})
	}
}

func TestRegistrationServiceAlwaysStoresStandardRole(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(filepath.Join(t.TempDir(), "service-auth.db")), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.User{}); err != nil {
		t.Fatal(err)
	}
	service := services.NewAuthService(repository.NewGormUserRepo(db), nil, nil)
	for _, role := range []string{"admin", "manager"} {
		user, err := service.Register(services.RegisterInput{Email: role + "@example.test", Password: "test-password-123", Role: role})
		if err != nil {
			t.Fatal(err)
		}
		if user.Role != models.RoleUser {
			t.Fatalf("direct service call granted role %q", user.Role)
		}
		var stored models.User
		if err := db.First(&stored, "id = ?", user.ID).Error; err != nil {
			t.Fatal(err)
		}
		if stored.Role != models.RoleUser {
			t.Fatalf("database persisted privileged role %q", stored.Role)
		}
	}
}
