package repository

import (
	"production-report-api/internal/models"

	"gorm.io/gorm"
)

type gormUserRepo struct {
	db *gorm.DB
}

func NewGormUserRepo(db *gorm.DB) UserRepository {
	return &gormUserRepo{db: db}
}

func (r *gormUserRepo) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *gormUserRepo) FindByID(id string) (*models.User, error) {
	var u models.User
	if err := r.db.First(&u, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *gormUserRepo) FindByEmail(email string) (*models.User, error) {
	var u models.User
	if err := r.db.First(&u, "email = ?", email).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *gormUserRepo) ExistsByEmail(email string) (bool, error) {
	var count int64
	if err := r.db.Model(&models.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// ---------- Production ----------

type gormProductionRepo struct {
	db *gorm.DB
}

func NewGormProductionRepo(db *gorm.DB) ProductionRepository {
	return &gormProductionRepo{db: db}
}

func (r *gormProductionRepo) Create(p *models.DailyProduction) error {
	return r.db.Create(p).Error
}

func (r *gormProductionRepo) FindByID(id string, userID string) (*models.DailyProduction, error) {
	var p models.DailyProduction
	q := r.db.Where("id = ?", id)
	if userID != "" {
		q = q.Where("user_id = ?", userID)
	}
	if err := q.First(&p).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *gormProductionRepo) List(userID string, dr DateRange) ([]models.DailyProduction, error) {
	var items []models.DailyProduction
	q := r.db.Model(&models.DailyProduction{})
	if userID != "" {
		q = q.Where("user_id = ?", userID)
	}
	if dr.StartDate != nil && *dr.StartDate != "" {
		q = q.Where("production_date >= ?", *dr.StartDate)
	}
	if dr.EndDate != nil && *dr.EndDate != "" {
		q = q.Where("production_date <= ?", *dr.EndDate)
	}
	q = q.Order("production_date DESC, created_at DESC")
	if err := q.Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (r *gormProductionRepo) Update(id string, userID string, p *models.DailyProduction) error {
	q := r.db.Model(&models.DailyProduction{}).Where("id = ?", id)
	if userID != "" {
		q = q.Where("user_id = ?", userID)
	}
	updates := map[string]interface{}{
		"production_date": p.ProductionDate,
		"items_produced":  p.ItemsProduced,
		"units":           p.Units,
		"notes":           p.Notes,
	}
	res := q.Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *gormProductionRepo) Delete(id string, userID string) error {
	q := r.db.Where("id = ?", id)
	if userID != "" {
		q = q.Where("user_id = ?", userID)
	}
	res := q.Delete(&models.DailyProduction{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// ---------- Expense ----------

type gormExpenseRepo struct {
	db *gorm.DB
}

func NewGormExpenseRepo(db *gorm.DB) ExpenseRepository {
	return &gormExpenseRepo{db: db}
}

func (r *gormExpenseRepo) Create(e *models.DailyExpense) error {
	return r.db.Create(e).Error
}

func (r *gormExpenseRepo) FindByID(id string, userID string) (*models.DailyExpense, error) {
	var e models.DailyExpense
	q := r.db.Where("id = ?", id)
	if userID != "" {
		q = q.Where("user_id = ?", userID)
	}
	if err := q.First(&e).Error; err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *gormExpenseRepo) List(userID string, dr DateRange) ([]models.DailyExpense, error) {
	var items []models.DailyExpense
	q := r.db.Model(&models.DailyExpense{})
	if userID != "" {
		q = q.Where("user_id = ?", userID)
	}
	if dr.StartDate != nil && *dr.StartDate != "" {
		q = q.Where("expense_date >= ?", *dr.StartDate)
	}
	if dr.EndDate != nil && *dr.EndDate != "" {
		q = q.Where("expense_date <= ?", *dr.EndDate)
	}
	q = q.Order("expense_date DESC, created_at DESC")
	if err := q.Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (r *gormExpenseRepo) Update(id string, userID string, e *models.DailyExpense) error {
	q := r.db.Model(&models.DailyExpense{}).Where("id = ?", id)
	if userID != "" {
		q = q.Where("user_id = ?", userID)
	}
	updates := map[string]interface{}{
		"expense_date": e.ExpenseDate,
		"category":     e.Category,
		"amount":       e.Amount,
		"description":  e.Description,
	}
	res := q.Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *gormExpenseRepo) Delete(id string, userID string) error {
	q := r.db.Where("id = ?", id)
	if userID != "" {
		q = q.Where("user_id = ?", userID)
	}
	res := q.Delete(&models.DailyExpense{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
