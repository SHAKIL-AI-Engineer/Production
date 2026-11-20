package repository

import (
	"production-report-api/internal/models"
)

// UserRepository defines data access for users.
type UserRepository interface {
	Create(user *models.User) error
	FindByID(id string) (*models.User, error)
	FindByEmail(email string) (*models.User, error)
	ExistsByEmail(email string) (bool, error)
}

// ProductionRepository defines data access for daily production records.
type ProductionRepository interface {
	Create(p *models.DailyProduction) error
	FindByID(id string, userID string) (*models.DailyProduction, error)
	List(userID string, dr DateRange) ([]models.DailyProduction, error)
	Update(id string, userID string, p *models.DailyProduction) error
	Delete(id string, userID string) error
}

// ExpenseRepository defines data access for daily expense records.
type ExpenseRepository interface {
	Create(e *models.DailyExpense) error
	FindByID(id string, userID string) (*models.DailyExpense, error)
	List(userID string, dr DateRange) ([]models.DailyExpense, error)
	Update(id string, userID string, e *models.DailyExpense) error
	Delete(id string, userID string) error
}

// DateRange mirrors the service-level filter for repository queries.
type DateRange struct {
	StartDate *string
	EndDate   *string
}
