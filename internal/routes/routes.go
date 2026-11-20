package routes

import (
	"net/http"

	"production-report-api/internal/config"
	"production-report-api/internal/handlers"
	"production-report-api/internal/middleware"
	"production-report-api/internal/models"
	"production-report-api/pkg/jwt"

	"github.com/gin-gonic/gin"
)

// Setup registers all routes and middleware on the Gin engine.
func Setup(
	engine *gin.Engine,
	authHandler *handlers.AuthHandler,
	productionHandler *handlers.ProductionHandler,
	expenseHandler *handlers.ExpenseHandler,
	reportHandler *handlers.ReportHandler,
	jwtMgr *jwt.Manager,
	cfg *config.Config,
) {
	// Global middleware
	engine.Use(gin.Recovery())
	engine.Use(middleware.Logger())
	engine.Use(corsMiddleware(cfg.CORSAllowedOrigins))

	// Health check
	engine.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// API v1 group
	v1 := engine.Group("/api/v1")

	// Auth (public)
	auth := v1.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.GET("/me", middleware.AuthMiddleware(jwtMgr), authHandler.Me)
		auth.POST("/logout", middleware.AuthMiddleware(jwtMgr), authHandler.Logout)
	}

	// Protected routes require a valid JWT
	protected := v1.Group("")
	protected.Use(middleware.AuthMiddleware(jwtMgr))
	{
		// Daily production
		productions := protected.Group("/productions")
		{
			productions.POST("", productionHandler.Create)
			productions.GET("", productionHandler.List)
			productions.GET("/:id", productionHandler.GetOne)
			productions.PUT("/:id", productionHandler.Update)
			productions.DELETE("/:id", productionHandler.Delete)
		}

		// Daily expense
		expenses := protected.Group("/expenses")
		{
			expenses.POST("", expenseHandler.Create)
			expenses.GET("", expenseHandler.List)
			expenses.GET("/:id", expenseHandler.GetOne)
			expenses.PUT("/:id", expenseHandler.Update)
			expenses.DELETE("/:id", expenseHandler.Delete)
		}

		// Reports
		reports := protected.Group("/reports")
		{
			reports.GET("/pnl", reportHandler.PnL)
			reports.GET("/summary", reportHandler.Summary)
			reports.GET("/dashboard", reportHandler.Dashboard)
		}

		// Admin-only example
		protected.GET("/admin/ping", middleware.RBACMiddleware(models.RoleAdmin), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "admin only"})
		})
	}

	// 404 handler
	engine.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": "route not found"})
	})
}

func corsMiddleware(allowedOrigins []string) gin.HandlerFunc {
	originMap := make(map[string]bool)
	for _, o := range allowedOrigins {
		originMap[o] = true
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" && (originMap[origin] || originMap["*"]) {
			c.Header("Access-Control-Allow-Origin", origin)
		} else if len(allowedOrigins) == 0 || originMap["*"] {
			c.Header("Access-Control-Allow-Origin", "*")
		} else if origin != "" {
			c.Header("Access-Control-Allow-Origin", allowedOrigins[0])
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, Accept")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
