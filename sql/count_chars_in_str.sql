CREATE FUNCTION `count_chars_in_str`(`str` VARCHAR(255),
        `ch` CHAR(1) CHARACTER SET utf8mb4
    ) RETURNS tinyint(3) unsigned
    NO SQL
    DETERMINISTIC
BEGIN
# Counts the number of occurencies of character in a string
  RETURN LENGTH(leave_allowed_chars(str, ch));
END ;;
