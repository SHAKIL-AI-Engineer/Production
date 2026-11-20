package services

import (
	"errors"

	"production-report-api/internal/models"
	"production-report-api/internal/repository"
)

// ExpenseService applies business logic around daily expense records.
type ExpenseService struct {
	expenseRepo repository.ExpenseRepository
}

// NewExpenseService constructs an ExpenseService.
func NewExpenseService(expenseRepo repository.ExpenseRepository) *ExpenseService {
	return &ExpenseService{expenseRepo: expenseRepo}
}

func (s *ExpenseService) Create(e *models.DailyExpense) error {
	if e.ExpenseDate == "" {
		return errors.New("expense_date is required")
	}
	if e.Category == "" {
		return errors.New("category is required")
	}
	if e.Amount < 0 {
		return errors.New("amount cannot be negative")
	}
	return s.expenseRepo.Create(e)
}

func (s *ExpenseService) List(userID string, dr DateRange) ([]models.DailyExpense, error) {
	repoRange := repository.DateRange{StartDate: dr.StartDate, EndDate: dr.EndDate}
	return s.expenseRepo.List(userID, repoRange)
}

func (s *ExpenseService) FindByID(id string, userID string, role string) (*models.DailyExpense, error) {
	if role == models.RoleAdmin || role == models.RoleManager {
		return s.expenseRepo.FindByID(id, "")
	}
	return s.expenseRepo.FindByID(id, userID)
}

func (s *ExpenseService) Update(id string, userID string, role string, e *models.DailyExpense) error {
	if e.ExpenseDate == "" {
		return errors.New("expense_date is required")
	}
	if e.Category == "" {
		return errors.New("category is required")
	}
	if e.Amount < 0 {
		return errors.New("amount cannot be negative")
	}
	if role == models.RoleAdmin || role == models.RoleManager {
		return s.expenseRepo.Update(id, "", e)
	}
	return s.expenseRepo.Update(id, userID, e)
}

func (s *ExpenseService) Delete(id string, userID string, role string) error {
	if role == models.RoleAdmin || role == models.RoleManager {
		return s.expenseRepo.Delete(id, "")
	}
	return s.expenseRepo.Delete(id, userID)
}
