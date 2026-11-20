package handlers

import (
	"net/http"

	"production-report-api/internal/models"
	"production-report-api/internal/services"
	"production-report-api/pkg/jwt"

	"github.com/gin-gonic/gin"
)

// ExpenseHandler handles daily expense endpoints.
type ExpenseHandler struct {
	expenseService *services.ExpenseService
}

// NewExpenseHandler constructs an ExpenseHandler.
func NewExpenseHandler(expenseService *services.ExpenseService) *ExpenseHandler {
	return &ExpenseHandler{expenseService: expenseService}
}

// Create godoc
// @Summary Create a daily expense record
// @Tags expense
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body models.DailyExpense true "expense payload"
// @Success 201 {object} models.DailyExpense
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /expenses [post]
func (h *ExpenseHandler) Create(c *gin.Context) {
	claims, ok := c.MustGet("jwt_claims").(*jwt.Claims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthenticated"})
		return
	}

	var e models.DailyExpense
	if err := c.ShouldBindJSON(&e); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	e.UserID = claims.UserID

	if err := h.expenseService.Create(&e); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, e)
}

// List godoc
// @Summary List daily expense records
// @Tags expense
// @Produce json
// @Security BearerAuth
// @Param start_date query string false "YYYY-MM-DD"
// @Param end_date query string false "YYYY-MM-DD"
// @Success 200 {array} models.DailyExpense
// @Failure 500 {object} map[string]string
// @Router /expenses [get]
func (h *ExpenseHandler) List(c *gin.Context) {
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

	items, err := h.expenseService.List(userID, dr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, items)
}

// GetOne godoc
// @Summary Get a single expense record
// @Tags expense
// @Produce json
// @Security BearerAuth
// @Param id path string true "expense ID"
// @Success 200 {object} models.DailyExpense
// @Failure 404 {object} map[string]string
// @Router /expenses/{id} [get]
func (h *ExpenseHandler) GetOne(c *gin.Context) {
	id := c.Param("id")
	claims := c.MustGet("jwt_claims").(*jwt.Claims)

	e, err := h.expenseService.FindByID(id, claims.UserID, claims.Role)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "expense record not found"})
		return
	}

	c.JSON(http.StatusOK, e)
}

// Update godoc
// @Summary Update an expense record
// @Tags expense
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "expense ID"
// @Param input body models.DailyExpense true "expense payload"
// @Success 200 {object} models.DailyExpense
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /expenses/{id} [put]
func (h *ExpenseHandler) Update(c *gin.Context) {
	id := c.Param("id")
	claims := c.MustGet("jwt_claims").(*jwt.Claims)

	var e models.DailyExpense
	if err := c.ShouldBindJSON(&e); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.expenseService.Update(id, claims.UserID, claims.Role, &e); err != nil {
		if err.Error() == "expense_date is required" || err.Error() == "category is required" || err.Error() == "amount cannot be negative" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "expense record not found"})
		return
	}

	e.ID = id
	c.JSON(http.StatusOK, e)
}

// Delete godoc
// @Summary Delete an expense record
// @Tags expense
// @Security BearerAuth
// @Param id path string true "expense ID"
// @Success 204 {object} nil
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /expenses/{id} [delete]
func (h *ExpenseHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	claims := c.MustGet("jwt_claims").(*jwt.Claims)

	if err := h.expenseService.Delete(id, claims.UserID, claims.Role); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "expense record not found"})
		return
	}

	c.Status(http.StatusNoContent)
}
