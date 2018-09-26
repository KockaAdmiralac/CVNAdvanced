ALTER TABLE `newusers` ADD COLUMN `language` VARCHAR(16) NOT NULL;
UPDATE `newusers` SET `language`="en";

