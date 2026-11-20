package models

import (
	"time"

	"gorm.io/gorm"
)

// DailyExpense represents a single day's expense record.
type DailyExpense struct {
	ID           string     `gorm:"type:text;primaryKey" json:"id"`
	UserID       string     `gorm:"type:text;not null;index" json:"user_id"`
	ExpenseDate  string     `gorm:"type:date;not null;index" json:"expense_date"`
	Category     string     `gorm:"type:text;not null" json:"category"`
	Amount       float64    `gorm:"not null;default:0" json:"amount"`
	Description  *string    `gorm:"type:text" json:"description,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (e *DailyExpense) BeforeCreate(tx *gorm.DB) error {
	if e.ID == "" {
		e.ID = newID()
	}
	return nil
}
