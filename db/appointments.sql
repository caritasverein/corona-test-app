CREATE TABLE `appointments` (
  `id` varchar(36) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `timeslot` datetime NOT NULL,
  `nameGiven` longtext NOT NULL,
  `nameFamily` longtext NOT NULL,
  `address` longtext NOT NULL,
  `dateOfBirth` date NOT NULL,
  `email` varchar(64),
  `phoneMobile` varchar(64),
  `phoneLandline` varchar(64),
  `testStartedAt` datetime,
  `testId` INT UNSIGNED,
  `testResult` ENUM('negative', 'positive', 'invalid'),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
