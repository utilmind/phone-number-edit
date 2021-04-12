/*
 *  phone-pattern - 0.1
 *  jQuery plugin for perfect formatting of phone numbers
 *
 *  Created by Aleksey Kuznietsov <utilmind@gmail.com> 10.04.2021
 */
(function() {
    "use strict";

    var pluginName = "phonePattern",
        phonePattern = function(input, options) {
            var me = this,
                $field = me.$field = $(input),

                digitsOnly = function(str, stripLeading0) {
                    var d = str.replace(/[^\d]/g, "");
                    return stripLeading0
                        ? d.replace(/^0+/, "")
                        : d;
                },

                phonePattern = $field.data("pattern") || "(XXX) XXX-XXXX", // USA is default
                phoneAltPattern = $field.data("pattern-alt"), // typical format: data-pattern-alt="2,3,4,9:0X XXX XX XX;". This is for Belgium. When region starts with 2, 3, 4 or 9, phone number have 7 characters. Standard is 6 with 2-digits regional code.
                patternAltPrefixes = false, // filled if alternative patterns exists

                originalPhonePattern = phonePattern,
                originalAltPattern = false, // filled after parsing

                phoneAllowZeroPrefix = ("0" === digitsOnly(phonePattern).charAt(0)),

                minPatternLength = $field.data("min-pattern-length") || 2,
                localPhoneLength = phonePattern.replace(/[^X]/g, "").length,

                charPattern = $field.prop("pattern") || "[\\d\\s\\(\\)\\[\\]\\-–—\\.,/]", // pattern="[\d\s\(\)\[\]\-–—\.,/]+"
                rePattern = new RegExp(charPattern),
                prevVal,

                // AK: See also my MySQL func, patternize().
                patternize = function(str, pattern, patternChar, rtl, trimToPattern) {
                    var len = str.length,
                        plen = pattern.length,
                        i = rtl ? len-1 : 0,
                        pi = rtl ? plen-1 : 0,

                        res = "";

                    if (minPatternLength > len) // less length don't need patternization.
                        return str;

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

                                    if (pch !== patternChar && new RegExp("[\\(\\){}\\[\\]<>'\"’`“”«»]").test(pch)) // brackets and quotes.
                                        res = rtl ? pch + res : res + pch;
                                }
                            }else
                                res = rtl ? pch + res : res + pch;
                        }
                    }

                    if (!trimToPattern)
                        res = rtl
                            ? str.substr(1) + " " + res
                            : res + " " + str.substr(str);

                    return res.trim(); // trim odd spaces
                },

                makeNicePhone = function() {
                    var phone = $field.val().trim(),
                        digPhone,
                        tempPattern,
                        tempAltPattern,
                        tempAltPrefixes,
                        tempAllowZeroPrefix,
                        prefix = "";

                    if ("+" === phone.charAt(0)) {
                        digPhone = digitsOnly(phone, 1); // trim all zeros in the beginning. There is no international phones starting with "0".

                        // TODO: get all country codes, to know their length + know pattern for each country
                        // ... but okay, let's do it for the USA...

                        tempAltPrefixes = false;
                        tempAltPattern = false;
                        tempAllowZeroPrefix = false;

                        if ("1" === digPhone.charAt(0)) {
                            tempPattern = "(XXX) XXX-XXXX"; // USA pattern
                            digPhone = digPhone.substr(1);
                            prefix = "+1 ";
                        }else if ("380" === digPhone.substr(0, 3)) {
                            tempPattern = "(XX) XXX-XX-XX"; // Ukraine
                            digPhone = digPhone.substr(3);
                            prefix = "+380 ";
                        }else if ("32" === digPhone.substr(0, 2)) {
                            tempPattern = "XX XX XX XX"; // Belgium
                            tempAltPattern = "X XXX XX XX";
                            tempAltPrefixes = new RegExp("^(2|3|4|9)");
                            digPhone = digPhone.substr(2);
                            prefix = "+32 ";
                        }else if ("61" === digPhone.substr(0, 2)) {
                            tempPattern = "XXX XXX XXX"; // Australia
                            digPhone = digPhone.substr(2);
                            prefix = "+61 ";
                        }else
                            return phone; // do nothing

                    }else {
                        digPhone = digitsOnly(phone),
                        tempPattern = phonePattern;
                        tempAltPattern = phoneAltPattern;
                        tempAltPrefixes = patternAltPrefixes;
                        tempAllowZeroPrefix = phoneAllowZeroPrefix;
                    }

                    // next stage
                    var haveZeros,
                        phoneLength = digPhone.length;

                    if (minPatternLength < phoneLength) {
                        digPhone = digPhone.replace(/^0+/, "");

                        var useAltPattern = tempAltPrefixes && tempAltPrefixes.test(digPhone);
                        if (useAltPattern)
                            tempPattern = tempAltPattern;

                        // local numbers only with possible 0-prefix...
                        if (tempAllowZeroPrefix && digPhone.length !== phoneLength)
                            tempPattern = useAltPattern ? originalAltPattern : originalPhonePattern;

                        $field.val(prefix + patternize(digPhone, tempPattern));
                    }
                },

                stripPatternLeading0 = function(pattern) {
                    // does phone pattern allows 0 as prefix?
                    var phoneAllowZeroPrefix = ("0" === digitsOnly(pattern).charAt(0));
                    if (phoneAllowZeroPrefix) 
                        pattern = pattern.replace("0", ""); // 1st is enough. No regexp required
                    return pattern;
                };

            me.options = $.extend({}, options);

            // alternative patterns
            if (phoneAltPattern) {
                var altPatterns = phoneAltPattern.split(";"), // TODO: support of multiple alternative patterns
                    altPattern = altPatterns[0].split(":");

                if (altPattern[0] && altPattern[1]) {
                    patternAltPrefixes = new RegExp("^("+ altPattern[0].replace(/,/g, "|") +")");
                    phoneAltPattern = stripPatternLeading0(originalAltPattern = altPattern[1]);
                }
            }

            // does phone pattern allows 0 as prefix?
            phonePattern = stripPatternLeading0(phonePattern);

            $field.on("keypress", function(e) {
                var curVal = this.value.trim(),
                    selStart = e.target.selectionStart,
                    selEnd = e.target.selectionEnd,
                    keyCode = e.keyCode,
                    ch = String.fromCharCode(keyCode);

                if (curVal && 0 === selStart && curVal.length === selEnd)
                    curVal = "";

                if ((("+" === ch) && 
                     (("" !== curVal) &&
                      ((0 !== selStart) || ("+" === curVal.charAt(0)))
                     ))

                     || ("+" !== ch && !rePattern.test(ch)) || // not allowed character.. We don't include "+" into the characters pattern, it's very specific case.
                         ("" === curVal &&
                             (("-" === ch) ||
                              ("0" === ch && !phoneAllowZeroPrefix))
                         )
                   ) {
                    e.preventDefault();
                }

                if (localPhoneLength && (localPhoneLength <= digitsOnly(curVal, 1).length) &&
                    (selStart === selEnd) &&
                    ("+" !== curVal.charAt(0)) &&
                    32 !== keyCode && 8 !== keyCode && 46 !== keyCode) {
                    e.preventDefault();
                }

            }).on("keyup", function(e) {
                var curVal = this.value,
                    digitsCurVal = digitsOnly(curVal.trim());

                if ((8 !== e.keyCode) && // 8 = backspace
                    ("" !== digitsCurVal) &&
                    (!prevVal || (digitsOnly(prevVal) !== digitsCurVal)) &&
                    (e.target.selectionStart === curVal.length)) {
                        makeNicePhone();

                        prevVal = this.value.trim(); // update
                }

            }).on("blur", function(e) {
                makeNicePhone();
            });
        };

    $.fn[pluginName] = function(options) {
        return this.each(function() {
            if (!$.data(this, pluginName)) { // avoid double initializaton
                $.data(this, pluginName, new phonePattern(this, options));
            }
        });
    };

})();


doInit(function() { // make autocompleable all emails on page
    if ("undefined" === typeof $) return 1;
    $('input[type="tel"][data-pattern]').phonePattern();
}, 1);
