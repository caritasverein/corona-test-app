CREATE
    ALGORITHM = UNDEFINED
    DEFINER = `coronatests`@`%`
    SQL SECURITY DEFINER
VIEW `appointments_valid` AS
    SELECT
        `appointments`.*
    FROM
        `appointments`
    WHERE
        `appointments`.`invalidatedAt` IS NULL
        AND (
          `appointments`.`updatedAt` > `appointments`.`createdAt`
          OR (
            `appointments`.`createdAt` > CURRENT_TIMESTAMP() - INTERVAL '1' HOUR
            AND `appointments`.`nameFamily` IS NOT NULL
          )
        );
