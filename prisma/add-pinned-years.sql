-- speakers tablosuna pinnedYears sütunu ekle
ALTER TABLE `speakers` ADD COLUMN `pinnedYears` JSON NOT NULL DEFAULT ('[]');