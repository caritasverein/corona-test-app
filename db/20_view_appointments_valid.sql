CREATE
    ALGORITHM = UNDEFINED
    DEFINER = `coronatests`@`%`
    SQL SECURITY DEFINER
VIEW `appointments_valid` AS
    SELECT
        `appointments`.`uuid` AS `uuid`,
        `appointments`.`createdAt` AS `createdAt`,
        `appointments`.`updatedAt` AS `updatedAt`,
        `appointments`.`invalidatedAt` AS `invalidatedAt`,
        `appointments`.`time` AS `time`,
        `appointments`.`nameGiven` AS `nameGiven`,
        `appointments`.`nameFamily` AS `nameFamily`,
        `appointments`.`address` AS `address`,
        `appointments`.`dateOfBirth` AS `dateOfBirth`,
        `appointments`.`email` AS `email`,
        `appointments`.`phoneMobile` AS `phoneMobile`,
        `appointments`.`phoneLandline` AS `phoneLandline`,
        `appointments`.`testStartedAt` AS `testStartedAt`,
        `appointments`.`testId` AS `testId`,
        `appointments`.`testResult` AS `testResult`
    FROM
        `appointments`
    WHERE
        `appointments`.`invalidatedAt` IS NULL
        AND (
          `appointments`.`updatedAt` > `appointments`.`createdAt`
          OR `appointments`.`createdAt` > CURRENT_TIMESTAMP() - INTERVAL '1' HOUR
        );
