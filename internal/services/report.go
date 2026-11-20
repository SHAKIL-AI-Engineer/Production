package services

import (
	"time"

	"production-report-api/internal/repository"
)

// ReportService aggregates production and expense data for P&L and summary reports.
type ReportService struct {
	productionRepo repository.ProductionRepository
	expenseRepo    repository.ExpenseRepository
	userRepo       repository.UserRepository
}

// NewReportService constructs a ReportService.
func NewReportService(
	productionRepo repository.ProductionRepository,
	expenseRepo repository.ExpenseRepository,
	userRepo repository.UserRepository,
) *ReportService {
	return &ReportService{
		productionRepo: productionRepo,
		expenseRepo:    expenseRepo,
		userRepo:       userRepo,
	}
}

// DateRange holds optional start/end filters.
type DateRange struct {
	StartDate *string
	EndDate   *string
}

// PnLResult is the Profit & Loss response payload.
type PnLResult struct {
	Period                DateRange     `json:"period"`
	TotalProductionValue  float64       `json:"total_production_value"`
	TotalExpense          float64       `json:"total_expense"`
	ProfitLoss            float64       `json:"profit_loss"`
	Status                string        `json:"status"` // PROFIT / LOSS / BREAK_EVEN
	ProductionCount       int           `json:"production_count"`
	ExpenseCount          int           `json:"expense_count"`
}

// SummaryResult is the summary response payload.
type SummaryResult struct {
	Period               DateRange   `json:"period"`
	TotalItemsProduced   int         `json:"total_items_produced"`
	TotalProductionValue float64     `json:"total_production_value"`
	TotalExpense         float64     `json:"total_expense"`
	NetProfit            float64     `json:"net_profit"`
	ByCategory           []CategoryTotals `json:"by_category"`
}

// CategoryTotals groups expense totals by category.
type CategoryTotals struct {
	Category string  `json:"category"`
	Amount   float64 `json:"amount"`
}

// DefaultUnitPrice is the assumed sale value per produced item (override via config in production).
const DefaultUnitPrice = 25.0

// PnL computes Profit & Loss for a date range, optionally scoped to a user.
func (r *ReportService) PnL(userID string, dr DateRange) (*PnLResult, error) {
	repoRange := repository.DateRange{StartDate: dr.StartDate, EndDate: dr.EndDate}
	productions, err := r.productionRepo.List(userID, repoRange)
	if err != nil {
		return nil, err
	}
	expenses, err := r.expenseRepo.List(userID, repoRange)
	if err != nil {
		return nil, err
	}

	totalItems := 0
	for _, p := range productions {
		totalItems += p.ItemsProduced
	}
	totalProductionValue := float64(totalItems) * DefaultUnitPrice

	totalExpense := 0.0
	for _, e := range expenses {
		totalExpense += e.Amount
	}

	pnl := totalProductionValue - totalExpense
	status := "BREAK_EVEN"
	if pnl > 0 {
		status = "PROFIT"
	} else if pnl < 0 {
		status = "LOSS"
	}

	return &PnLResult{
		Period:                dr,
		TotalProductionValue:  totalProductionValue,
		TotalExpense:          totalExpense,
		ProfitLoss:            pnl,
		Status:                status,
		ProductionCount:       len(productions),
		ExpenseCount:          len(expenses),
	}, nil
}

// Summary computes aggregate summary for a date range, optionally scoped to a user.
func (r *ReportService) Summary(userID string, dr DateRange) (*SummaryResult, error) {
	repoRange := repository.DateRange{StartDate: dr.StartDate, EndDate: dr.EndDate}
	productions, err := r.productionRepo.List(userID, repoRange)
	if err != nil {
		return nil, err
	}
	expenses, err := r.expenseRepo.List(userID, repoRange)
	if err != nil {
		return nil, err
	}

	totalItems := 0
	totalProductionValue := 0.0
	for _, p := range productions {
		totalItems += p.ItemsProduced
		totalProductionValue += float64(p.ItemsProduced) * DefaultUnitPrice
	}

	totalExpense := 0.0
	categoryMap := make(map[string]float64)
	for _, e := range expenses {
		totalExpense += e.Amount
		categoryMap[e.Category] += e.Amount
	}

	byCategory := make([]CategoryTotals, 0, len(categoryMap))
	for cat, amt := range categoryMap {
		byCategory = append(byCategory, CategoryTotals{Category: cat, Amount: amt})
	}

	return &SummaryResult{
		Period:               dr,
		TotalItemsProduced:   totalItems,
		TotalProductionValue: totalProductionValue,
		TotalExpense:         totalExpense,
		NetProfit:            totalProductionValue - totalExpense,
		ByCategory:           byCategory,
	}, nil
}

// Dashboard returns today's and current-month KPIs for a user.
func (r *ReportService) Dashboard(userID string) (map[string]interface{}, error) {
	now := time.Now().UTC()
	today := now.Format("2006-01-02")
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).Format("2006-01-02")

	todayRange := DateRange{StartDate: &today, EndDate: &today}
	monthRange := DateRange{StartDate: &monthStart, EndDate: &today}

	todaySummary, err := r.Summary(userID, todayRange)
	if err != nil {
		return nil, err
	}
	monthSummary, err := r.Summary(userID, monthRange)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"date": today,
		"today": map[string]interface{}{
			"items_produced": todaySummary.TotalItemsProduced,
			"production_value": todaySummary.TotalProductionValue,
			"expense": todaySummary.TotalExpense,
			"net_profit": todaySummary.NetProfit,
		},
		"month_to_date": map[string]interface{}{
			"items_produced": monthSummary.TotalItemsProduced,
			"production_value": monthSummary.TotalProductionValue,
			"expense": monthSummary.TotalExpense,
			"net_profit": monthSummary.NetProfit,
		},
	}, nil
}


