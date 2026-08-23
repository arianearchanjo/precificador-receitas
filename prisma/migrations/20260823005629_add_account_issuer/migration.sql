-- AlterTable
ALTER TABLE `account` ADD COLUMN `issuer` VARCHAR(191) NULL;

-- Backfill
UPDATE `account` SET `issuer` = 'local:credential' WHERE `providerId` = 'credential' AND (`issuer` IS NULL OR `issuer` = '');
