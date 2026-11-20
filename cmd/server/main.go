package main

import (
	"log"

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
