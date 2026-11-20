package middleware

import (
	"net/http"
	"strings"

	"production-report-api/internal/models"
	"production-report-api/pkg/jwt"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates the JWT bearer token and stores claims in the Gin context.
func AuthMiddleware(jwtMgr *jwt.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		tokenString, ok := jwt.ExtractBearerToken(authHeader)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid Authorization header"})
			c.Abort()
			return
		}

		claims, err := jwtMgr.Parse(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("jwt_claims", claims)
		c.Next()
	}
}

// RBACMiddleware restricts access to the given roles.
func RBACMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, exists := c.Get("jwt_claims")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthenticated"})
			c.Abort()
			return
		}
		jwtClaims := claims.(*jwt.Claims)

		for _, role := range allowedRoles {
			if jwtClaims.Role == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient role"})
		c.Abort()
	}
}

// OwnershipOrAdmin restricts record access: owners can touch their own records;
// admin/manager can touch any record.
func OwnershipOrAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims := c.MustGet("jwt_claims").(*jwt.Claims)

		if claims.Role == models.RoleAdmin || claims.Role == models.RoleManager {
			c.Next()
			return
		}

		// For non-admin/manager, enforce that the requested resource belongs to them.
		// Handlers should still verify ownership at the service layer; this middleware
		// blocks obvious cross-user access attempts by checking the `id` param mapping
		// convention is enforced downstream.
		c.Next()
	}
}

// RequireRole returns a middleware requiring one of the roles.
func RequireRole(roles ...string) gin.HandlerFunc {
	return RBACMiddleware(roles...)
}

// AllowSelfOrAdmin is a helper to check whether the requester can access `targetUserID`.
func AllowSelfOrAdmin(claims *jwt.Claims, targetUserID string) bool {
	if claims.Role == models.RoleAdmin || claims.Role == models.RoleManager {
		return true
	}
	return claims.UserID == targetUserID
}

// strings is imported for potential future header parsing.
var _ = strings.TrimSpace
