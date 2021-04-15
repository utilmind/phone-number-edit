/*
 *  phone-pattern - 0.2.2
 *  jQuery plugin for perfect formatting of phone numbers
 *
 *  Created by Aleksey Kuznietsov <utilmind@gmail.com> 10.04.2021
 */
(function() {
    "use strict";

    var pluginName = "phonePattern",

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

        phonePattern = function(input/*, options*/) {
            var me = this,
                $field = me.$field = $(input),

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

                                    if (pch !== patternChar && new RegExp("[\\(\\){}\\[\\]<>'\"’`“”«»]").test(pch)) // brackets and quotes.
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

                        for (prefix in internationalPatterns)
                            if (prefix == phone.substr(1, prefix.length)) {
                                tempPattern = internationalPatterns[prefix][0];
                                curMinPatternLength = internationalPatterns[prefix][1];
                                break;
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
                };


            // OPTIONS... But we don't use any. Let's keep it commented for a while.
            // me.options = $.extend({}, options);


            // PROCESS PATTERNS
            phonePattern = preparePhonePatterns(phonePattern, 1);

            // let's try to fix it immediately upon initialization.
            if ($field.val())
                makeNicePhone();

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
                    // ok
                }else if (
                     (!rePattern.test(ch) || // not allowed character.. We don't include "+" into the characters pattern, it's very specific case.
                       (0 === selStart && ("-" === ch || ")" === ch || "/" === ch || "." === ch))) ||

                    (0 !== selStart && "+" === ch) ||

                    (curPhoneLength && (curPhoneLength <= digitsOnly(curVal, 1).length) &&
                      // (selStart === selEnd) && // no selection
                      // UPD 14.04.2021: I decided to allow any insertions. If user inserts then user missed something, returned to position and know what they doing. Let's allow this.
                      (selStart === curVal.length) && // end of the string
                      8 !== keyCode && 46 !== keyCode) // backspace or del
                   )
                    e.preventDefault();


            }).on("keyup", function(e) {
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

            }).on("paste", function(e) {
                  var dataSource = e.originalEvent.clipboardData || window.clipboardData, // second is IE11
                      paste = dataSource.getData("text"); // second is IE11

                  if (paste) {
                      e.preventDefault();
                      this.value = paste.match(rePattern).join();
                  }

            }).on("paste blur", function(e) {
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


// find doInit() code right on the HTML page. It used to make sure that jQuery already loaded and wait till "onload" event if not yet.
doInit(function() { // make autocompleable all emails on page
    if ("undefined" === typeof $) return 1;
    $('input[type="tel"][data-pattern]').phonePattern();
}, 1);
