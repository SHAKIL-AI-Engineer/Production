package services

import (
	"testing"

	"production-report-api/internal/models"
	"production-report-api/internal/repository"
)

type mockExpenseRepo struct {
	items []models.DailyExpense
}

func (m *mockExpenseRepo) Create(e *models.DailyExpense) error {
	m.items = append(m.items, *e)
	return nil
}

func (m *mockExpenseRepo) FindByID(id string, userID string) (*models.DailyExpense, error) {
	return nil, nil
}

func (m *mockExpenseRepo) List(userID string, dr repository.DateRange) ([]models.DailyExpense, error) {
	var res []models.DailyExpense
	for _, it := range m.items {
		if userID == "" || it.UserID == userID {
			res = append(res, it)
		}
	}
	return res, nil
}

func (m *mockExpenseRepo) Update(id string, userID string, e *models.DailyExpense) error {
	return nil
}

func (m *mockExpenseRepo) Delete(id string, userID string) error {
	return nil
}

type mockUserRepo struct{}

func (m *mockUserRepo) Create(user *models.User) error            { return nil }
func (m *mockUserRepo) FindByID(id string) (*models.User, error)  { return nil, nil }
func (m *mockUserRepo) FindByEmail(e string) (*models.User, error) { return nil, nil }
func (m *mockUserRepo) ExistsByEmail(e string) (bool, error)      { return false, nil }

func TestReportPnL(t *testing.T) {
	prodRepo := &mockProductionRepo{
		items: []models.DailyProduction{
			{ID: "p1", UserID: "u1", ItemsProduced: 10}, // 10 * 25 = 250
		},
	}
	expRepo := &mockExpenseRepo{
		items: []models.DailyExpense{
			{ID: "e1", UserID: "u1", Category: "raw_materials", Amount: 150},
		},
	}
	reportSvc := NewReportService(prodRepo, expRepo, &mockUserRepo{})

	pnl, err := reportSvc.PnL("", DateRange{})
	if err != nil {
		t.Fatalf("unexpected pnl error: %v", err)
	}

	if pnl.TotalProductionValue != 250.0 {
		t.Errorf("expected production value 250, got %f", pnl.TotalProductionValue)
	}
	if pnl.TotalExpense != 150.0 {
		t.Errorf("expected total expense 150, got %f", pnl.TotalExpense)
	}
	if pnl.ProfitLoss != 100.0 {
		t.Errorf("expected profit loss 100, got %f", pnl.ProfitLoss)
	}
	if pnl.Status != "PROFIT" {
		t.Errorf("expected status PROFIT, got %s", pnl.Status)
	}
}
