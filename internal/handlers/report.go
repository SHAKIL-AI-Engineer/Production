package handlers

import (
	"net/http"

	"production-report-api/internal/models"
	"production-report-api/internal/services"
	"production-report-api/pkg/jwt"

	"github.com/gin-gonic/gin"
)

// ReportHandler handles P&L and summary report endpoints.
type ReportHandler struct {
	reportService *services.ReportService
}

// NewReportHandler constructs a ReportHandler.
func NewReportHandler(reportService *services.ReportService) *ReportHandler {
	return &ReportHandler{reportService: reportService}
}

// PnL godoc
// @Summary Profit & Loss report
// @Tags reports
// @Produce json
// @Security BearerAuth
// @Param start_date query string false "YYYY-MM-DD"
// @Param end_date query string false "YYYY-MM-DD"
// @Success 200 {object} services.PnLResult
// @Failure 500 {object} map[string]string
// @Router /reports/pnl [get]
func (h *ReportHandler) PnL(c *gin.Context) {
	claims := c.MustGet("jwt_claims").(*jwt.Claims)
	userID := claims.UserID
	if claims.Role == models.RoleAdmin || claims.Role == models.RoleManager {
		userID = "" // admins/managers see all (repository handles empty userID as no filter)
	}

	dr := services.DateRange{
		StartDate: queryParam(c, "start_date"),
		EndDate:   queryParam(c, "end_date"),
	}

	result, err := h.reportService.PnL(userID, dr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// Summary godoc
// @Summary Summary report
// @Tags reports
// @Produce json
// @Security BearerAuth
// @Param start_date query string false "YYYY-MM-DD"
// @Param end_date query string false "YYYY-MM-DD"
// @Success 200 {object} services.SummaryResult
// @Failure 500 {object} map[string]string
// @Router /reports/summary [get]
func (h *ReportHandler) Summary(c *gin.Context) {
	claims := c.MustGet("jwt_claims").(*jwt.Claims)
	userID := claims.UserID
	if claims.Role == models.RoleAdmin || claims.Role == models.RoleManager {
		userID = ""
	}

	dr := services.DateRange{
		StartDate: queryParam(c, "start_date"),
		EndDate:   queryParam(c, "end_date"),
	}

	result, err := h.reportService.Summary(userID, dr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// Dashboard godoc
// @Summary Dashboard KPIs (today + month-to-date)
// @Tags reports
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /reports/dashboard [get]
func (h *ReportHandler) Dashboard(c *gin.Context) {
	claims := c.MustGet("jwt_claims").(*jwt.Claims)
	userID := claims.UserID
	if claims.Role == models.RoleAdmin || claims.Role == models.RoleManager {
		userID = ""
	}

	result, err := h.reportService.Dashboard(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}
