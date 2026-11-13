-- Arşiv açıklamaları tablosu (eksikse oluşturur, mevcut veriyi bozmaz)
CREATE TABLE IF NOT EXISTS `archive_descriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `year` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `archive_descriptions_year_key`(`year`),
    INDEX `archive_descriptions_year_idx`(`year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
