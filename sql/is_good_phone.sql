CREATE FUNCTION `is_good_phone`(`phone` VARCHAR(32),
        `local_phone_length` TINYINT UNSIGNED,
        `local_country_code` VARCHAR(6)
    ) RETURNS tinyint(3) unsigned
    NO SQL
    DETERMINISTIC
BEGIN
  # see also String.clearPhone() from utilmind's common.js
  # see also nice_phone_number & is_good_phone.

  DECLARE s VARCHAR(32); # for string with digits only
  DECLARE is_international TINYINT UNSIGNED;
  DECLARE l INT UNSIGNED;

  SET phone = TRIM(phone);
  IF "" = phone THEN
      RETURN 0;
  END IF;

  SET s = TRIM(LEADING "0" FROM leave_numbers(phone)); # remove all possible "0" in beginning, that sometimes specified to dial locally
  SET is_international = IF("+" = LEFT(phone, 1), 1, 0);

  SET l = LENGTH(s);
  IF 4 > l THEN # we can't have phone numbers less than 4 digits. Short numbers not counted anyway
      RETURN 0;
  END IF;

  IF is_international THEN # minimum length for international numbers is 7 characters (including country code)
      IF 7 > l OR 15 < l THEN
          RETURN 0; # bad
      END IF;

      # USA and Canada, 11 including country code (10 w/o country code)
      IF "1" = SUBSTRING(s, 1, 1) THEN
          IF 11 != l THEN
              RETURN 0;
          END IF;
          IF SUBSTRING(s, 2, 3) < 201 THEN # All area codes starts with 201. So all below 201 should be marked as BAD.
              RETURN 0;
          END IF;
      END IF;

      # Australia, 11 including country code (9 w/o country code)
      IF "61" = SUBSTRING(S, 1, 2) AND 11 != l THEN
          RETURN 0;
      END IF;

      # Mexico, 12 including country code (10 w/o country code)
      IF "52" = SUBSTRING(s, 1, 2) AND 10 != l THEN
          RETURN 0;
      END IF;

      # India, 12 including country code (10 w/o country code)
      IF "91" = SUBSTRING(s, 1, 2) AND 12 != l THEN
          RETURN 0;
      END IF;

      # China, 13 or 15, including country code (11 or 13 w/o country code)
      IF "86" = SUBSTRING(s, 1, 2) AND (13 != l OR 15 != l) THEN
          RETURN 0;
      END IF;

      # Ukraine, 12, including country code (9 w/o country code)
      IF "380" = SUBSTRING(s, 1, 2) AND 12 != l THEN
          RETURN 0;
      END IF;

      RETURN 1;
  END IF;

  # No +? We consider it as local number...
  IF 0 = local_phone_length OR local_phone_length IS NULL THEN
      SET local_phone_length = 10; # standard length for phone numbers in the USA (and in many other countries)
  END IF;

  # phone starts with country code?
  IF local_country_code IS NOT NULL AND
     local_country_code != "" AND
     l - LENGTH(local_country_code) = local_phone_length AND
     local_country_code = LEFT(s, LENGTH(local_country_code)) THEN # has country code in beginning?
     
      # with country code BUT w/o "+" in prefix, but still looking good. 
      SET s = SUBSTRING(s, LENGTH(local_country_code)+1); # Just strip the country code then for the final checks...
      SET l = LENGTH(s);
  END IF;

  IF l = local_phone_length THEN # length is exactly the local phone length
      IF 1 = local_country_code AND # We're checking the USA or Canada?
         SUBSTRING(s, 1, 3) < 201 THEN # All area codes can't start with numbers below 201. So all below 201 should be marked as BAD.
          RETURN 0;
      END IF;

      RETURN 1;
  END IF;

  RETURN 0;
END ;;
