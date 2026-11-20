package services

import (
	"errors"

	"production-report-api/internal/models"
	"production-report-api/internal/repository"
)

// ProductionService applies business logic around daily production records.
type ProductionService struct {
	productionRepo repository.ProductionRepository
}

// NewProductionService constructs a ProductionService.
func NewProductionService(productionRepo repository.ProductionRepository) *ProductionService {
	return &ProductionService{productionRepo: productionRepo}
}

func (s *ProductionService) Create(p *models.DailyProduction) error {
	if p.ProductionDate == "" {
		return errors.New("production_date is required")
	}
	if p.ItemsProduced < 0 {
		return errors.New("items_produced cannot be negative")
	}
	if p.Units == "" {
		p.Units = "pcs"
	}
	return s.productionRepo.Create(p)
}

func (s *ProductionService) List(userID string, dr DateRange) ([]models.DailyProduction, error) {
	repoRange := repository.DateRange{StartDate: dr.StartDate, EndDate: dr.EndDate}
	return s.productionRepo.List(userID, repoRange)
}

func (s *ProductionService) FindByID(id string, userID string, role string) (*models.DailyProduction, error) {
	if role == models.RoleAdmin || role == models.RoleManager {
		// Admins/managers bypass ownership; find by id only.
		return s.productionRepo.FindByID(id, "")
	}
	return s.productionRepo.FindByID(id, userID)
}

func (s *ProductionService) Update(id string, userID string, role string, p *models.DailyProduction) error {
	if p.ProductionDate == "" {
		return errors.New("production_date is required")
	}
	if p.ItemsProduced < 0 {
		return errors.New("items_produced cannot be negative")
	}
	if role == models.RoleAdmin || role == models.RoleManager {
		return s.productionRepo.Update(id, "", p)
	}
	return s.productionRepo.Update(id, userID, p)
}

func (s *ProductionService) Delete(id string, userID string, role string) error {
	if role == models.RoleAdmin || role == models.RoleManager {
		return s.productionRepo.Delete(id, "")
	}
	return s.productionRepo.Delete(id, userID)
}
