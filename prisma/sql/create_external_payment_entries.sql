-- Sadece dışarıdan ödeme satırları (form_responses'a dokunmaz)
CREATE TABLE IF NOT EXISTS `external_payment_entries` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `amount` INT NOT NULL,
  `userId` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `external_payment_entries_userId_idx` (`userId`),
  INDEX `external_payment_entries_createdAt_idx` (`createdAt`),
  CONSTRAINT `external_payment_entries_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
