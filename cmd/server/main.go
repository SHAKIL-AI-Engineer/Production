package main

import (
	"log"
	"net/http"
	"os"

	"production-report-api/internal/config"
	"production-report-api/internal/database"
	"production-report-api/internal/handlers"
	"production-report-api/internal/repository"
	"production-report-api/internal/routes"
	"production-report-api/internal/services"
	"production-report-api/pkg/jwt"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	// Set Gin mode based on environment
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	// Keep deployment setup failures actionable instead of crashing a cold start.
	if os.Getenv("VERCEL") == "1" && cfg.DatabaseURL == "" && os.Getenv("DB_HOST") == "" {
		log.Print("Database setup pending: connect PostgreSQL and set DATABASE_URL or POSTGRES_URL")
		engine := gin.New()
		engine.Use(gin.Recovery())
		engine.NoRoute(func(c *gin.Context) {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "The reporting database is not connected yet. Please contact the workspace administrator."})
		})
		if err := engine.Run(":" + cfg.AppPort); err != nil {
			log.Fatalf("server failed: %v", err)
		}
		return
	}

	// Database
	db, err := database.New(cfg)
	if err != nil {
		log.Fatalf("database init failed: %v", err)
	}

	// Repositories
	userRepo := repository.NewGormUserRepo(db)
	productionRepo := repository.NewGormProductionRepo(db)
	expenseRepo := repository.NewGormExpenseRepo(db)

	// JWT
	jwtMgr := jwt.NewManager(cfg.JWTSecret)

	// Services
	authService := services.NewAuthService(userRepo, jwtMgr, cfg)
	reportService := services.NewReportService(productionRepo, expenseRepo, userRepo)
	productionService := services.NewProductionService(productionRepo)
	expenseService := services.NewExpenseService(expenseRepo)

	// Handlers
	authHandler := handlers.NewAuthHandler(authService, jwtMgr)
	productionHandler := handlers.NewProductionHandler(productionService)
	expenseHandler := handlers.NewExpenseHandler(expenseService)
	reportHandler := handlers.NewReportHandler(reportService)

	// Router
	engine := gin.New()
	routes.Setup(engine, authHandler, productionHandler, expenseHandler, reportHandler, jwtMgr, cfg)

	// Start
	addr := ":" + cfg.AppPort
	log.Printf("Server starting on %s (env=%s)", addr, cfg.AppEnv)
	if err := engine.Run(addr); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
