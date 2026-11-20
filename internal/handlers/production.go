package handlers

import (
	"net/http"

	"production-report-api/internal/models"
	"production-report-api/internal/services"
	"production-report-api/pkg/jwt"

	"github.com/gin-gonic/gin"
)

// ProductionHandler handles daily production endpoints.
type ProductionHandler struct {
	productionService *services.ProductionService
}

// NewProductionHandler constructs a ProductionHandler.
func NewProductionHandler(productionService *services.ProductionService) *ProductionHandler {
	return &ProductionHandler{productionService: productionService}
}

// Create godoc
// @Summary Create a daily production record
// @Tags production
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body models.DailyProduction true "production payload"
// @Success 201 {object} models.DailyProduction
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /productions [post]
func (h *ProductionHandler) Create(c *gin.Context) {
	claims, ok := c.MustGet("jwt_claims").(*jwt.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthenticated"})
		return
	}

	var p models.DailyProduction
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	p.UserID = claims.UserID

	if err := h.productionService.Create(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, p)
}

// List godoc
// @Summary List daily production records
// @Tags production
// @Produce json
// @Security BearerAuth
// @Param start_date query string false "YYYY-MM-DD"
// @Param end_date query string false "YYYY-MM-DD"
// @Success 200 {array} models.DailyProduction
// @Failure 500 {object} map[string]string
// @Router /productions [get]
func (h *ProductionHandler) List(c *gin.Context) {
	claims := c.MustGet("jwt_claims").(*jwt.Claims)

	userID := claims.UserID
	if claims.Role == models.RoleAdmin || claims.Role == models.RoleManager {
		// Admins and managers see records across all users
		userID = ""
	}

	dr := services.DateRange{
		StartDate: queryParam(c, "start_date"),
		EndDate:   queryParam(c, "end_date"),
	}

	items, err := h.productionService.List(userID, dr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, items)
}

// GetOne godoc
// @Summary Get a single production record
// @Tags production
// @Produce json
// @Security BearerAuth
// @Param id path string true "production ID"
// @Success 200 {object} models.DailyProduction
// @Failure 404 {object} map[string]string
// @Router /productions/{id} [get]
func (h *ProductionHandler) GetOne(c *gin.Context) {
	id := c.Param("id")
	claims := c.MustGet("jwt_claims").(*jwt.Claims)

	p, err := h.productionService.FindByID(id, claims.UserID, claims.Role)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "production record not found"})
		return
	}

	c.JSON(http.StatusOK, p)
}

// Update godoc
// @Summary Update a production record
// @Tags production
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "production ID"
// @Param input body models.DailyProduction true "production payload"
// @Success 200 {object} models.DailyProduction
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /productions/{id} [put]
func (h *ProductionHandler) Update(c *gin.Context) {
	id := c.Param("id")
	claims := c.MustGet("jwt_claims").(*jwt.Claims)

	var p models.DailyProduction
	if err := c.ShouldBindJSON(&p); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.productionService.Update(id, claims.UserID, claims.Role, &p); err != nil {
		if err.Error() == "production_date is required" || err.Error() == "items_produced cannot be negative" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "production record not found"})
		return
	}

	p.ID = id
	c.JSON(http.StatusOK, p)
}

// Delete godoc
// @Summary Delete a production record
// @Tags production
// @Security BearerAuth
// @Param id path string true "production ID"
// @Success 204 {object} nil
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /productions/{id} [delete]
func (h *ProductionHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	claims := c.MustGet("jwt_claims").(*jwt.Claims)

	if err := h.productionService.Delete(id, claims.UserID, claims.Role); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "production record not found"})
		return
	}

	c.Status(http.StatusNoContent)
}

func queryParam(c *gin.Context, key string) *string {
	v := c.Query(key)
	if v == "" {
		return nil
	}
	return &v
}
