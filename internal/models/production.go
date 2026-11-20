package models

import (
	"time"

	"gorm.io/gorm"
)

// DailyProduction represents a single day's production record.
type DailyProduction struct {
	ID             string     `gorm:"type:text;primaryKey" json:"id"`
	UserID         string     `gorm:"type:text;not null;index" json:"user_id"`
	ProductionDate string     `gorm:"type:date;not null;index" json:"production_date"`
	ItemsProduced  int        `gorm:"not null;default:0" json:"items_produced"`
	Units          string     `gorm:"type:text;not null;default:'pcs'" json:"units"`
	Notes          *string    `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (p *DailyProduction) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = newID()
	}
	if p.Units == "" {
		p.Units = "pcs"
	}
	return nil
}
