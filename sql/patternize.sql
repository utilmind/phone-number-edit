CREATE FUNCTION `patternize`(`str` VARCHAR(255),
        `pattern` VARCHAR(255),
        `pattern_char` VARCHAR(1),
        `rtl` TINYINT UNSIGNED,
        `trim_to_pattern` TINYINT UNSIGNED
    ) RETURNS varchar(255) CHARSET utf8mb4
    NO SQL
    DETERMINISTIC
BEGIN
# typical pattern is (XXX) XXX-XXXX, where pattern_char is X.
# Typical usage: patternize("+15551234567", "(XXX) XXX-XXXX", "X", 1, 0);
# Result is +1 (555) 123-4567. If "trim" is 1 (strip all outside of the pattern), then result is (555) 123-4567.
# If "rtl" is 0, so apply left-to-right order, result could be (+15) 551-234567, that's actually wrong for this particular case.

  DECLARE res VARCHAR(255) DEFAULT ""; # AK: NOT CHAR! to gracefully CONCAT spaces.

  DECLARE cur_ch VARCHAR(1); # AK: NOT CHAR! to gracefully CONCAT spaces.
  DECLARE len TINYINT UNSIGNED DEFAULT LENGTH(str);
  DECLARE i TINYINT UNSIGNED DEFAULT IF(rtl, len, 1);

  DECLARE pch VARCHAR(1); # AK: NOT CHAR! to gracefully CONCAT spaces.
  DECLARE plen TINYINT UNSIGNED DEFAULT LENGTH(pattern);
  DECLARE pi TINYINT UNSIGNED DEFAULT IF(rtl, plen, 1);

  IF 0 < plen THEN
    WHILE IF(rtl, pi > 0 AND i > 0, pi <= plen AND i <= len) DO
      SET pch = SUBSTRING(pattern, pi, 1);
      SET pi = IF(rtl, pi-1, pi+1);

      IF pch = pattern_char THEN
        SET cur_ch = SUBSTRING(str, i, 1);
        SET res = IF(rtl, CONCAT(cur_ch, res), CONCAT(res, cur_ch));
        SET i = IF(rtl, i-1, i+1);

        # next char
        IF IF(rtl, pi = 0 OR i = 0, pi > plen OR i > len) THEN
            SET pch = SUBSTRING(pattern, pi, 1);
            IF (pch != pattern_char AND FIND_IN_SET(pch, "(,),{,},[,],<,>,',\",’,`,“,”,«,»")) THEN # brackets and quotes.
                SET res = IF(rtl, CONCAT(pch, res), CONCAT(res, pch));
            END IF;
        END IF;

      ELSE
        SET res = IF(rtl, CONCAT(pch, res), CONCAT(res, pch));
      END IF;

    END WHILE;
  END IF;

  IF !trim_to_pattern THEN
      SET res = IF(rtl, CONCAT(SUBSTRING(str, 1, i), " ", res), CONCAT(res, " ", SUBSTRING(str, i)));
  END IF;

  RETURN TRIM(res); # trim odd spaces
END ;;
