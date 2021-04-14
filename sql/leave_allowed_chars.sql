CREATE FUNCTION `leave_allowed_chars`(`str` VARCHAR(255) CHARACTER SET utf8mb4,
        `allowed_chars` VARCHAR(255) CHARACTER SET utf8mb4
    ) RETURNS varchar(255) CHARSET utf8mb4
    NO SQL
    DETERMINISTIC
BEGIN
/* Advanced leave_numbers() w/o regular expressions.
   Usage: leave_allowed_chars("my phone is +1 (555) 555-5555", "0,1,2,3,4,5,6,7,8,9, ,+,-,(,)")
 */
  DECLARE tmp VARCHAR(255); # AK: not CHAR!
  DECLARE res VARCHAR(255) DEFAULT ""; # AK: not CHAR!
  DECLARE chr VARCHAR(1); # AK: not CHAR!
  DECLARE len INT UNSIGNED DEFAULT LENGTH(str);
  DECLARE i INT UNSIGNED DEFAULT 1;

  IF 0 < len THEN
    WHILE i <= len DO
      SET chr = SUBSTRING(str, i, 1);

      /* remove &#...; */
      IF "&" = chr AND "#" = SUBSTRING(str, i+1, 1) THEN
        WHILE i <= len AND (";" != SUBSTRING(str, i, 1)) DO
          SET i = i+1;
        END WHILE;
      END IF;
      
      SET tmp = FIND_IN_SET(BINARY(chr), BINARY(allowed_chars));
      IF 0 < tmp THEN
        SET res = CONCAT(res, chr);
      END IF;
      SET i = i+1;
    END WHILE;
  END IF;

  RETURN res;
END ;;
