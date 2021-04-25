CREATE TABLE `windows` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `invalidatedAt` datetime,
  `start` datetime NOT NULL,
  `end` datetime NOT NULL,
  `numQueues` INT UNSIGNED NOT NULL,
  `appointmentDuration` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
