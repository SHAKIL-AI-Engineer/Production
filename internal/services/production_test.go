package services

import (
	"errors"
	"testing"

	"production-report-api/internal/models"
	"production-report-api/internal/repository"
)

type mockProductionRepo struct {
	items []models.DailyProduction
}

func (m *mockProductionRepo) Create(p *models.DailyProduction) error {
	m.items = append(m.items, *p)
	return nil
}

func (m *mockProductionRepo) FindByID(id string, userID string) (*models.DailyProduction, error) {
	for _, it := range m.items {
		if it.ID == id && (userID == "" || it.UserID == userID) {
			return &it, nil
		}
	}
	return nil, errors.New("record not found")
}

func (m *mockProductionRepo) List(userID string, dr repository.DateRange) ([]models.DailyProduction, error) {
	var res []models.DailyProduction
	for _, it := range m.items {
		if userID == "" || it.UserID == userID {
			res = append(res, it)
		}
	}
	return res, nil
}

func (m *mockProductionRepo) Update(id string, userID string, p *models.DailyProduction) error {
	for i, it := range m.items {
		if it.ID == id && (userID == "" || it.UserID == userID) {
			m.items[i] = *p
			return nil
		}
	}
	return errors.New("record not found")
}

func (m *mockProductionRepo) Delete(id string, userID string) error {
	for i, it := range m.items {
		if it.ID == id && (userID == "" || it.UserID == userID) {
			m.items = append(m.items[:i], m.items[i+1:]...)
			return nil
		}
	}
	return errors.New("record not found")
}

func TestProductionServiceValidation(t *testing.T) {
	svc := NewProductionService(&mockProductionRepo{})

	// Missing date
	err := svc.Create(&models.DailyProduction{ItemsProduced: 10})
	if err == nil || err.Error() != "production_date is required" {
		t.Errorf("expected production_date is required error, got %v", err)
	}

	// Negative items
	err = svc.Create(&models.DailyProduction{ProductionDate: "2026-11-20", ItemsProduced: -5})
	if err == nil || err.Error() != "items_produced cannot be negative" {
		t.Errorf("expected items_produced cannot be negative error, got %v", err)
	}

	// Valid
	p := &models.DailyProduction{ProductionDate: "2026-11-20", ItemsProduced: 100}
	err = svc.Create(p)
	if err != nil {
		t.Errorf("unexpected error on valid production: %v", err)
	}
	if p.Units != "pcs" {
		t.Errorf("expected default units pcs, got %s", p.Units)
	}
}

func TestProductionAdminBypass(t *testing.T) {
	repo := &mockProductionRepo{
		items: []models.DailyProduction{
			{ID: "prod-1", UserID: "worker-1", ProductionDate: "2026-11-20", ItemsProduced: 50, Units: "pcs"},
		},
	}
	svc := NewProductionService(repo)

	// Admin accesses worker's record
	item, err := svc.FindByID("prod-1", "admin-1", models.RoleAdmin)
	if err != nil {
		t.Fatalf("admin failed to find record: %v", err)
	}
	if item.ID != "prod-1" {
		t.Errorf("expected prod-1, got %s", item.ID)
	}

	// Other worker cannot find worker-1's record
	_, err = svc.FindByID("prod-1", "worker-2", models.RoleUser)
	if err == nil {
		t.Error("expected error when worker-2 accesses worker-1's record, got nil")
	}
}
