CREATE FUNCTION `leave_numbers`(`str` CHAR(255)
    ) RETURNS char(255) CHARSET utf8mb4
    NO SQL
    DETERMINISTIC
BEGIN
  # returns string, not integer. Although it will be a string with digits only.
  RETURN leave_allowed_chars(str, "0,1,2,3,4,5,6,7,8,9");
END ;;
