/*
 *  phone-pattern - 0.2.6
 *  jQuery plugin for perfect formatting of phone numbers
 *
 *  Created by Aleksey Kuznietsov <utilmind@gmail.com>, April 2021
 *
 *  Attributes for individual customization:
 *
 *    * data-valid-class="className"		-- automatically validate syntax of entered phone number and put this class if the number IS VALID. Multiple classes allowed, space separated.
 *    * data-invalid-class="className"		-- automatically validate syntax of entered phone number and put this class if the number IS INVALID. Multiple classes allowed, space separated.
 *    * data-valid-show="#element"		-- element id to *show* when phone number IS VALID (and hide when invalid or unspecified).
 *    * data-invalid-show="#element"		-- element id to *show* when phone number IS INVALID (and hiden when valid or unspecified).
 *
 *    * data-allow-invalid-submit="#element"	-- submission of invalid input usually blocked by the wrapper form. Set it to any TRUE value to allow invalid submissions.
 *    * data-custom-validity="...message..."	-- custom error message about requirement to fix the input before submission.
 *
 *  Events:
 *    * validate(e, isPhoneValid)	-- triggered on validation. isPhoneValid can be either TRUE, FALSE or "undefined", when input is empty.
 *
 *  Also:
 *    * use $inputField.data("is-valid") to check whether current input is valid (presumably).
 *
 *  TODO (maybe):
 *    * custom validation of phone number in callback function. Or in event.
 *    * method to force validation of phone number. (Maybe just use on("change validate", validateInput) and validate it with trigger("validate")?
 *
 */
(function() {
    "use strict";

    var pluginName = "phonePattern",

        defValidClass = "", // automatically validate syntax of entered phone number and put this class if the number IS VALID. Multiple classes allowed, space separated.
        defInvalidClass = "is-invalid", // automatically validate syntax of entered phone number and put this class if the number IS INVALID. Multiple classes allowed, space separated.

        defValidityMessage = "This phone number is obviously invalid. Please fix your input.",

        internationalPatterns = {
                 // pattern + minimum input length to start process the pattern
              1: ["(XXX) XXX-XXXX", 3], // USA and Canada
             31: ["XX XXX XX XX;67,80,90:XXX XXX XXX", 2], // Netherlands. Leading 0 allowed for local number patterns.
             32: ["XX/XX XX XX;2,3,4,9:X/XXX XX XX", 2], // Belgium. Leading 0 allowed for local number patterns.
             33: ["XXX XX XX XX", 3], // France
             // 39: ["XXX XXXXXXXX", 3], // Italy. From 9 to 11 digits: http://www.self.gutenberg.org/articles/eng/Telephone_numbers_in_Italy
             44: ["XXXX XXX XXXX", 4], // UK. But it's a lot more complicated. TODO: add particular cases.
             // 46: [";7:", 2], // Sweden TODO.
             48: ["XXX-XXX-XXX", 3], // Poland. This is mobiles. Stationery (fixed-line) numbers is XX-XXX-XX-XX. TODO: add particular cases.
             49: ["XXX-XXX-XXX", 3], // Germany. This is for mobiles. Stationery usually XXXX-XXX-XXXX.
             52: ["XX-XXX-XXXX", 2], // Mexico. Or XXX-XXX-XXXX. Always 10 digits.
             61: ["XXX XXX XXX", 3], // Australia. Not sure about format of fixed-line phones, but looks good for mobiles. Leading 0 allowed.
             91: ["XX-XXX-XXXXX", 2], // India. Mobiles only. 2X-access (94 or 98), 3X-provider, 5X-subscriber
            372: ["XXX XXXX;5,8:XXXX XXXX;", 3], // Estonia
            375: ["(XX) XXX-XX-XX", 2], // Belarus, but looks like the same as Ukraine.
            380: ["(XX) XXX-XX-XX", 2], // Ukraine. Mobiles only. Length of the area codes for stationery numbers may vary from 2 to 6 digits.
            420: ["XX XX XX XX;5,602:XXX XXX XXX", 3], // Chechia
            995: ["(XXX) XXX XXX", 3], // Georgia.
        },

        // @private
        reBrackets = new RegExp("[\\(\\){}\\[\\]<>'\"’`“”«»]"),

        phonePattern = function(input/*, options*/) {
            var me = this,
                $field = me.$field = $(input),

                validClass = $field.data("valid-class") || defValidClass,
                invalidClass = $field.data("invalid-class") || defInvalidClass,
                validShow = $field.data("valid-show"),
                invalidShow = $field.data("invalid-show"),

                digitsOnly = function(str, stripLeading0) {
                    var d = str.replace(/[^\d]/g, "");
                    return stripLeading0
                        ? d.replace(/^0+/, "")
                        : d;
                },

                phonePattern = $field.data("pattern"), // No default! Empty = no local pattern. Typical format: data-pattern="2,3,4,9:(0X) XXX-XX-XX;(0XX) XX-XX-XX". When region starts with 2, 3, 4 or 9, phone number have 7 digits. Standard is 6 with 2-digits regional code. And with possible leading 0.
                phoneAllowZeroPrefix, // if ANY pattern allow 0 in prefix.

                minPatternLength = $field.data("min-pattern-length") || 2,
                curMinPatternLength = minPatternLength,

                curPhoneLength,

                charPattern = $field.prop("pattern") || "[\\d\\s\\(\\)\\[\\]\\+\\-–—\\.,/]+",
                rePattern = new RegExp(charPattern),
                grePattern = new RegExp(charPattern, "g"),
                prevVal,

                preparePhonePatterns = function(phonePatterns, setDefaults) {
                    var i, resPattern = [];

                    phonePatterns = phonePatterns.split(";");
                    for (i in phonePatterns) {
                        var arr = phonePatterns[i].split(":"),
                            str, str2,
                            prefix = "";

                        if (str = arr[0].trim()) { // if pattern not empty
                            if (arr[1] && (str2 = arr[1].trim())) {
                                prefix = new RegExp("^("+ str.replace(/,/g, "|") +")");
                                str = str2;
                            }

                            if (setDefaults && !phoneAllowZeroPrefix) // check if ANY pattern allow 0-prefix
                                phoneAllowZeroPrefix = "0" === digitsOnly(str).charAt(0);

                            resPattern.push([str, // 0 = original pattern
                                             setDefaults ? stripPatternLeading0(str) : str, // w/o leading 0. But still the pattern. The same as str, if str has no leading 0.
                                             prefix]); // prefix of the number, that may change the pattern
                        }
                    }
                    return resPattern;
                },

                // AK: See also my MySQL func, patternize(): https://github.com/utilmind/phone-number-edit/blob/main/sql/patternize.sql
                patternize = function(str, pattern, patternChar, rtl, trimToPattern) {
                    var len = str.length,
                        plen = pattern.length,
                        i = rtl ? len-1 : 0,
                        pi = rtl ? plen-1 : 0,

                        res = "";

                    if (0 < plen) {
                        if (!patternChar) patternChar = "X";

                        while (rtl ? 0 < pi && 0 < i : plen >= pi && len >= i) {
                            var pch = pattern.charAt(pi);
                            pi+= rtl ? -1 : 1;

                            if (pch === patternChar) {
                                var curCh = str.charAt(i);
                                res = rtl ? curCh + res : res + curCh;
                                i+= rtl ? -1 : 1;

                                if (rtl ? 0 === pi || 0 === i : plen < pi-1 || len < i-1) {
                                    pch = pattern.charAt(pi);

                                    if (pch !== patternChar && reBrackets.test(pch)) // brackets and quotes.
                                        res = rtl ? pch + res : res + pch;
                                }
                            }else
                                res = rtl ? pch + res : res + pch;
                        }
                    }

                    if (!trimToPattern) { // we reuse "i" from previous loop
                        var addon = rtl ? str.substr(1) : str.substr(i);
                        res = rtl
                            ? (addon ? str.substr(1) + " " : "") + res
                            : res + (addon ? " " + str.substr(i) : "");
                    }

                    return res.trimStart(); // trim odd spaces. But allow last space of pattern
                },

                makeNicePhone = function() {
                    var phone = $field.val().trim(),

                        hasPlusPrefix = "+" === phone.charAt(0),
                        hasZeroPrefix,
                        prefix = "",
                        digPhone = digitsOnly(phone, hasPlusPrefix), // trim all zeros in the beginning if there is "+" prefix. There is no international phones starting with "0".

                        tempPhoneLength,
                        tempPattern,
                        tempAllowZeroPrefix,
                        tempCountryCodeLength;

                    curPhoneLength = 0; // no limit for typing
                    if (hasPlusPrefix) {
                        // TODO: get all country codes, to know their length + know pattern for each country
                        // ... but okay, let's do it for the USA...

                        for (prefix in internationalPatterns) {
                            if (prefix == digPhone.substr(0, prefix.length)) {
                                tempPattern = internationalPatterns[prefix][0];
                                curMinPatternLength = internationalPatterns[prefix][1];
                                break;
                            }
                        }

                        if (!tempPattern)
                            return phone; // do nothing

                        tempPattern = preparePhonePatterns(tempPattern);
                        digPhone = digPhone.substr(tempCountryCodeLength = prefix.length);
                        tempPhoneLength = digPhone.length;
                        tempAllowZeroPrefix = false; // ATTN! There is no patterns that allow 0-prefix! We use "+(country code)" instead!

                        prefix = "+" + prefix + " ";
                    }else {
                        tempPattern = phonePattern;
                        tempPhoneLength = digPhone.length;

                        tempAllowZeroPrefix = phoneAllowZeroPrefix;
                        tempCountryCodeLength = 0;

                        curMinPatternLength = minPatternLength;

                        if (hasZeroPrefix = "0" === digPhone.charAt(0))
                            digPhone = digPhone.replace(/^0+/, ""); // now this is phone without leading zeros (they could be more than 1)

                        if (!tempPattern.length || (curMinPatternLength > digPhone.length)) // no local patterns? Or length of input less than possible?
                            return phone; // nothing to do
                    }


                    // next stage... Choose an appropriate pattern to use.
                    var i, thisPattern, defPattern, usePattern;
                    for (i in tempPattern) {
                        thisPattern = tempPattern[i];
                        if (!thisPattern[2]) { // no alts
                            if (!defPattern)
                                defPattern = thisPattern;

                        }else if (thisPattern[2].test(digPhone)) { // has alts + this number corresponds it
                            usePattern = thisPattern;
                            break;
                        }
                    }
                    if (!usePattern) usePattern = defPattern;
                    usePattern = usePattern[tempAllowZeroPrefix && hasZeroPrefix ? 0 : 1]; // with or w/o leading zeros

                    // update input
                    $field.val(prefix + patternize(digPhone, usePattern));

                    // set new limit for typing
                    curPhoneLength = usePattern.replace(/[^X]/g, "").length + tempCountryCodeLength;
                },

                stripPatternLeading0 = function(pattern) {
                    // does phone pattern allows 0 as prefix?
                    var phoneAllowZeroPrefix = ("0" === digitsOnly(pattern).charAt(0));
                    if (phoneAllowZeroPrefix)
                        pattern = pattern.replace("0", ""); // cut 1st 0 only. ATTN! It's not 1st char, only 1st 0. Pattern an be "(0..."
                    return pattern;
                },

                validateInput = function() {
                    var val = $field[0].value,

                        isValidPhone = !!val && val.isValidPhone(),
                        isInvalidPhone = !!val && !isValidPhone,

                        isValid = !!val ? isValidPhone : undefined;

                    $field.data("is-valid", isValid)
                          .trigger("validate", isValid);

                    if (validClass)
                        $field.toggleClass(validClass, isValidPhone);
                    if (invalidClass)
                        $field.toggleClass(invalidClass, isInvalidPhone);

                    if (validShow)
                        $(validShow).toggle(isValidPhone);
                    if (invalidShow)
                        $(invalidShow).toggle(isInvalidPhone);
                };


            // OPTIONS... But we don't use any. Let's keep it commented for a while.
            // me.options = $.extend({}, options);


            // PROCESS PATTERNS
            phonePattern = preparePhonePatterns(phonePattern, 1);

            // EVENTS
            $field.on("keypress", function(e) {
                var curVal = this.value.trim(),
                    selStart = e.target.selectionStart,
                    // selEnd = e.target.selectionEnd,
                    keyCode = e.keyCode,
                    ch = String.fromCharCode(keyCode);

                // whole text selected? UPD 14.04.2021. We don't need it after allowing to make insertions even if length of number exceeds the limit.
                //if (curVal && 0 === selStart && curVal.length === selEnd)
                //    curVal = "";

                if ((32 > keyCode) || // "Enter" (and possibly other conrol keys) are always allowed
                    ((0 === selStart) &&
                      (
                         ("0" === ch && phoneAllowZeroPrefix && "0" !== curVal.charAt(0)) ||
                         ("+" === ch && "+" !== curVal.charAt(0))
                      )
                   )) {
                    // ok.... this is beginning of input or some control character

                }else if ( // ...check impossible characters                                                                                                                        
                     (!rePattern.test(ch) || // not allowed character.. We don't include "+" into the characters pattern, it's very specific case.
                       (0 === selStart && ("-" === ch || ")" === ch || "/" === ch || "." === ch))) ||

                    (0 !== selStart && "+" === ch) ||

                    // ...check maximum possible length
                    (curPhoneLength && (curPhoneLength <= digitsOnly(curVal, 1).length) && // curPhoneLength is current MAXIMUM possible length of phone number
                      // (selStart === selEnd) && // no selection
                      // UPD 14.04.2021: I decided to allow any insertions. If user inserts then user missed something, returned to position and know what they doing. Let's allow this.
                      (selStart === curVal.length) && // end of the string
                      8 !== keyCode && 46 !== keyCode) // backspace or del
                   ) {
                    e.preventDefault();
                    // return;

                }else { // input
                    var curVal = this.value,
                        digitsCurVal = digitsOnly(curVal.trim());

                    if (e.target.selectionStart === curVal.length && // is end
                            ("" !== digitsCurVal)) {

                        if (8 === e.keyCode) { // 8 = backspace
                            this.value = prevVal = this.value.replace(/[^\d]+$/, "");

                        }else if // if NOT backspace AND...
                            (!prevVal || (digitsOnly(prevVal) !== digitsCurVal)) {
                                makeNicePhone();
                                prevVal = this.value.trim(); // update
                        }
                    }
                }
            }).on("paste keyup", function() {
                if (false === $field.data("is-valid")) // skip undefined
                    validateInput();

            }).on("paste", function(e) {
                  var dataSource = e.originalEvent.clipboardData || window.clipboardData, // second is IE11
                      paste = dataSource.getData("text"); // second is IE11

                  if (paste) {
                      e.preventDefault();
                      this.value = paste.match(grePattern);
                  }

            }).on("paste change", function() { // change covers "blur", if something has been changed. But unlike "blur" it also updates the value if it was changed programmatically.
                makeNicePhone();

            }).on("change", validateInput);


            // fix existing value
            var val = $field.val();
            if (val) { // if field already have some value
                makeNicePhone();
                validateInput();
                // if we're focused -- move cursor to the end
                if ($field.is(":focus"))
                    $field[0].setSelectionRange(val.length, val.length);
            }


            // allow submission of invalid input
            if (!$field.data("allow-invalid-submit")) {
                // find the wrapper form and hook onSubmit...
                var $form = $field.closest("form");
                if ($form.length)
                    $form.on("submit", function(e) {
                        if (!$field.data("is-valid")) {
                            var form = this;
                            e.preventDefault();

                            $field[0].setCustomValidity($field.data("custom-validity") || defValidityMessage);
                            $field.one("change input", function() { // once
                                this.setCustomValidity("");
                            });

                            if (!form.checkValidity())
                                if ("undefined" !== typeof form.reportValidity) // modern browsers
                                    form.reportValidity();
                                else { // Internet Explorer
                                    // Create the temporary button, click and remove it
                                    var btn = document.createElement("button");
                                    form.appendChild(btn);
                                    btn.trigger("click");
                                    form.removeChild(btn);
                                }
                        }
                    });
            }
        };


    if (!String.prototype.isValidPhone) { // we may already have it from utilmind's commons.
        // USA phones should contain at least 10 digits. For Ukrainian phones it’s OK to have only 9 digits, without leading 0 and country code prefix: [+380] 88 888-88-88.
        // UPD. India: +91(+10 digits), China: +86(+10 or 11 digits), etc.
        String.prototype.isValidPhone = function(minDigitsCount, maxDigitsCount) { // please customize minDigitsCount!
            var str = this.trim();
            if (str) {
                var len,
                    isPlus = ("+" === str.charAt(0)),
                    defMin = isPlus ? 11 : 10, // default 10 digits is standard w/o country code for the US, Canada and many other countries.
                                               // however, for countries like Ukraine all numbers without country code have only 9 digits length, or even 7, without regional code.
                                               // So please customize minDigitsCount accordingly to the length of numbers in your default country!

                    defMax = isPlus ? 14 : 11; // 11 digits maximum w/o country code (China) or 14 with country code (Austria).
  
                if (str = str.match(/\d/g)) { // all digits only!
                    len = str.length;

                    return len >= (minDigitsCount || defMin) &&
                           len <= (maxDigitsCount || defMax);
                }
            }
        }
    }


    $.fn[pluginName] = function(options) {
        return this.each(function() {
            if (!$.data(this, pluginName)) { // avoid double initializaton
                $.data(this, pluginName, new phonePattern(this, options));
            }
        });
    };

})();

$('input[type="tel"][data-pattern]').phonePattern();
