CREATE FUNCTION `leave_numbers`(`str` CHAR(255)
    ) RETURNS char(255) CHARSET utf8mb4
    NO SQL
    DETERMINISTIC
BEGIN
  RETURN REGEXP_REPLACE(REGEXP_REPLACE(str, "&#[0-9]+;", ""), "[^0-9]", "");
END ;;
