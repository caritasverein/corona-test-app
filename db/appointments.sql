CREATE TABLE `appointments` (
  `uuid` varchar(36) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `invalidatedAt` datetime,
  `time` datetime NOT NULL,
  `nameGiven` varchar(256),
  `nameFamily` varchar(256),
  `address` longtext,
  `dateOfBirth` date,
  `email` varchar(64),
  `phoneMobile` varchar(64),
  `phoneLandline` varchar(64),
  `testStartedAt` datetime,
  `testId` INT UNSIGNED,
  `testResult` ENUM('negative', 'positive', 'invalid'),
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
