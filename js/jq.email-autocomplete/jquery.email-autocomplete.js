/*
 *  email-autocomplete - 0.5.0 (forked from original code by by Low Yong Zhen  v0.1.3)
 *  jQuery plugin that displays in-place autocomplete suggestions for email input fields.
 *
 *
 *  Made by Low Yong Zhen <yz@stargate.io>
 *  Modified by Oleksii Kuznietsov <utilmind@gmail.com> 29.11.2019 - 24.01.2020, 10.04.2021 (v0.3), 01.06.2022 (v0.5.0, invalid-syntax stuff).
 *
 *
 *  AK NOTES:
 *    1. It works in all modern browsers, including Internet Explorer 11. (Didn't tested it with older IE's.)
 *    2. I have dropped support of legacy functionality. ECMAScript 5 (released in 2009) required to run this code.
 *       See Array.indexOf(), Array.isArray(), Array.forEach() etc. I could rewrite it with legacy code, but don't want to do this.
 *
 *  Attributes for individual customization:
 *    * data-complete-onblur="1"		-- auto-completes the suggestion on blur (on switching the input focus out)
 *    * data-domains="domain1.com, domain2.com"	-- allows to specify additional domains for autocompletion. And they have higher priority than default domains.
 *
 *  Validation of input. Only for input fields with type="email". (Otherwise, if type="text" we can't be 100% certain that non-email value, like "username" is also allowed.)
 *    * data-valid-class="className"		-- automatically validate syntax of entered email and put this class if email IS VALID. Multiple classes allowed, space separated.
 *    * data-invalid-class="className"		-- automatically validate syntax of entered email and put this class if email IS INVALID. Multiple classes allowed, space separated.
 *    * data-invalid-syntax-class="className"	-- class used if email syntax invalid
 *    * data-valid-show="#element"		-- element id to *show* when email IS VALID (and hide when invalid or unspecified).
 *    * data-invalid-show="#element"		-- element id to *show* when email IS INVALID (and hiden when valid or unspecified).
 *    * data-invalid-syntax-show="#element"	-- element id to *show* when email has INVALID SYNTAX (but in general it may look as valid).
 *
 *    * data-allow-invalid-submit="#element"	-- submission of invalid input usually blocked by the wrapper form. Set it to any TRUE value to allow invalid submissions.
 *    * data-custom-validity="...message..."	-- custom error message about requirement to fix the input before submission.
 *    * data-custom-syntax-validity="...message..."	-- custom error message if email syntax invalid. ((If not specified, then "data-custom-validity" used.)
 *
 *    * data-invalid-email="invalid@email.addr" -- syntactically correct email address which should be marked as invalid. (So mark "previous" email or address which "already taken".)
 *
 *    ...If you'd like to skip validation on the form submission, even if the input is invalid, set "ignore-invalid" class to the field.
 *
 *  Events:
 *    * autocomplete(e)			-- triggered after auto-completion. This is additionally to regular "change" event.
 *    * validate(e, isEmailValid)	-- triggered on validation. isEmailValid can be either TRUE, FALSE or "undefined", when input is empty.
 *
 *  Also:
 *    * use $inputField.data("is-valid") to check whether current input is valid (presumably).
 *    * use $inputField.data("is-invalid-syntax") to check whether syntax is invalid.
 *
 */
(function($, window, document, undefined) {
    // "use strict"; // uncomment for development branch

    var pluginName = "emailautocomplete",
        STR_IS_VALID		= "is-valid",
        STR_IS_INVALID		= "is-invalid",
        STR_IS_INVALID_SYNTAX	= "is-invalid-syntax",

        defaults = {
            completeOnBlur: false, // or fill an attribute: data-complete-onblur="1"

         // ATTN! These classes work only for <input type="email" />. Otherwise, if regular text (eg usernames) is allowed, we can't know for sure whether the field is invalid.
            validClass: "", // automatically validate syntax of entered email and put this class if email IS VALID. Multiple classes allowed, space separated.
            invalidClass: STR_IS_INVALID, // automatically validate syntax of entered email and put this class if email IS INVALID. Multiple classes allowed, space separated.
            invalidSyntaxClass: STR_IS_INVALID_SYNTAX,

            validitySyntaxMessage: "This email is obviously invalid. Please fix your input.", // only on bad syntax
            validityMessage: "Please use different email address.",

            suggClass: "tt-hint", // "eac-sugg", // AK original classname, but I prefer to use just simple color. Some time ago here was "suggColor", but inline styles are unsafe for CSP, so let's use only class.
            domains: [], // add custom domains here, or in attribute: data-domains="domain1.com, domain2.com"
            defDomains: [ // you may override default domains setting up the "defDomains".
                "gmail.com",
                "googlemail.com",
                "yahoo.com",
                // "yahoo.ca", // odd :)
                "yahoo.co.uk",
                "yahoo.co.in",
                "yahoo.co.th",
                "yahoo.co.jp",
                "yahoo.ie",
                // "yahoo.it", // odd :)
                "yahoo.fr",
                "yahoo.de",
                // "yahoo.dk", // odd :)
                "yahoo.es",
                "yahoo.pl",
                // "yahoo.com.au",
                // "yahoo.com.ar",
                // "yahoo.com.br",
                // "yahoo.com.mx",
                // "yahoo.com.ph",
                "hotmail.com",
                "hotmail.co.uk",
                "hotmail.de",
                "hotmail.fr",
                "hotmail.it",
                "hotmail.ru",
                "outlook.com",
                "outlook.es",
                "live.com",
                "live.co.uk",
                "live.fr",
                "facebook.com",
                "rocketmail.com",
                "icloud.com",
                "aol.com",
                "aim.com", // aol service
                "mail.com",
                "mail.ru",		// UA-RU
                "mail.ua",		// UA
                "mail.be",		// BE
                "mail.fr",		// FR
                "mail.de",		// DE
                "msn.com",
                "mac.com",
                "me.com",
                "comcast.net",
                "sbcglobal.net",
                "verizon.net",
                "att.net",
                "bellsouth.net",
                "peoplepc.com",   // earthlink
                "mindspring.com", // earthlink
                "earthlink.net",  // earthlink
                "gmx.com",
                // "index.com", // dead
                "inbox.com",
                "inbox.ru",
                "pobox.com",
                "juno.com",
                "lycos.com",
                "zohomail.com",
                "protonmail.com",
                "hushmail.com",
                "rediffmail.com",
                "tutanota.com",
                "topmail.com",
                "charter.net",	// spectrum
                "roadrunner.com",	// spectrum
                "optonline.net",	// optimum
                "prodigy.net",	// at&t
                "zoominternet.net",
                "cox.net", // after comcast
                "ymail.com",
                "sky.com",
                "laposte.net",

                // Ukraine + Europe

                "wanadoo.fr",		// FR
                "orange.fr",		// FR
                "free.fr",		// FR
                "neuf.fr",		// FR
                "voila.fr",		// FR

                "yandex.ru",		// UA-RU
                "yandex.ua",		// UA
                "yandex.by",		// BY
                "yandex.com",		// shit
                "ukr.net",		// UA
                "meta.ua",		// UA
                "online.ua",		// UA
                "i.ua",		// UA
                "email.ua",		// UA
                "email.it",		// IT
                "e-mail.ua",		// UA
                "ua.fm",		// UA
                "football.ua",	// UA
                "3g.ua",		// UA
                "tyt.in.ua",		// UA
                "voliacable.com",	// UA
                "breezein.net",	// UA
                "rambler.ru",		// UA-RU
                "list.ru",		// UA-RU
                "bk.ru",		// UA-RU
                "qip.ru",		// UA-RU
                "pisem.net",		// UA-RU
                "webmail.ru",		// UA-RU
                "newmail.ru",		// UA-RU
                "nm.ru",		// UA-RU
                "pop3.ru",		// UA-RU
                "smtp.ru",		// UA-RU
                "pochta.ru",		// UA-RU
                "bigmir.net",		// UA
                // "gala.net",		// UA. dead
                "tut.by",		// BY

                "skynet.be",		// BE
                "telenet.be",		// BE
                "planet.nl",		// NL
                "zonnet.nl",		// NL
                "home.nl",		// NL
                "chello.nl",		// NL

                "shaw.ca",		// CA
                "seznam.cz",		// CZ
                "poczta.fm",		// PL
                "alice.it",		// IT
                "superdada.it",	// IT
                "katamail.com",	// IT
                "libero.it",		// IT
                "tiscali.it",		// IT
                "tin.it",		// IT
                "freenet.de",		// DE
                "t-online.de",	// DE
                "web.de",		// DE
                "arcor.de",		// DE
                "freemail.hu",	// HU

                "terra.com.br",	// BR

            // the rest...
                "bigpond.com",	// after "bigmir"
                "qq.com",
                "ntlworld.com",
                "centurytel.net",
                "usa.net",		// below ukr.net
            ],
        }, // end of defaults

    // -- @private
    // AK: it's good enough to be canonized somewhere separately
        copyCSS = function(targetEl, sourceElOrVal, styleName) {
            if (Array.isArray(styleName)) {
                styleName.forEach(function(style) {
                    copyCSS(targetEl, sourceElOrVal, style); // recursion!
                });

            }else {
                if ("object" === typeof sourceElOrVal)
                    sourceElOrVal = $(sourceElOrVal).css(styleName);

                if ($(targetEl).css(styleName) !== sourceElOrVal) // maybe this is odd? need research
                    $(targetEl).css(styleName, sourceElOrVal);
            }
        },

        fl0at0 = function(v) { // same as parseFloat, but returns 0 if parseFloat returns non-numerical value. (Not the same as fl0at() from utilmind's commons.)
            return isNaN(v = parseFloat(v)) ? 0 : v;
        };

    if (!String.prototype.isValidEmail) { // we may already have it from utilmind's commons.
        // see also is_valid_email() in "strings.php".
        String.prototype.isValidEmail = function() {
            // This all are valid accordingly to RFC: !#$%&'*+-/=?^_`{|}~
            // Gmail use + for subadressing. Usage of other special chars in unknown, but they are still valid anyway.
            // Double-dot, however (..) is not allowed.
            return 0 <= this.indexOf("..")
                ? false // email can't have 2 dots at row
                : /^([\w!#$%&'*+\-/=?^_`{|}~]+(?:\.[\w!#$%&'*+\-/=?^_`{|}~]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,30}(?:\.[a-z]{2})?)$/i.test(this.trim()); // the longest domain extension in 2015 was ".cancerresearch", and looks like it's not the limit. UPD. how about .travelersinsurance? I set up it the longest domain extension to 30 chars.
        }
    }


    // -- GO!
    function emailAutocomplete(input, options) {
        options = $.extend({}, defaults, options);

        var me = this,
            $field = me.$field = $(input),

            completeOnBlur = $field.data("complete-onblur"),
            inputDomains = $field.data("domains"),
            validClass = $field.data("valid-class"),
            invalidClass = $field.data("invalid-class"),
            invalidSyntaxClass = $field.data("invalid-syntax-class");

        me.options = options;

    // BLUR
        if (undefined !== completeOnBlur) // if value specified -- use as specified, even "" is value.
            options.completeOnBlur = completeOnBlur;

    // DOMAINS
        me._domains = options.domains
            .concat(inputDomains // string with domains from "data-domains" attribute. We converting it to an array.
                        ? inputDomains.split(",").map(function(s) { return s.trim(); }) // trim all domains
                        : [],
                    options.defDomains); // arrays with domains, default + 2nd priority default and custom lists

    // VALIDATION
        if (undefined !== validClass)
            options.validClass = validClass;
        if (undefined !== invalidClass)
            options.invalidClass = invalidClass;
        if (undefined !== invalidSyntaxClass)
            options.invalidSyntaxClass = invalidSyntaxClass;
    // ... little bit more
        options.validShow = $field.data("valid-show");
        options.invalidShow = $field.data("invalid-show");
        options.invalidSyntaxShow = $field.data("invalid-syntax-show");

        me.init();
    }

    emailAutocomplete.prototype = {
        init: function() {
            var me = this,
                options = me.options,
                $field = me.$field,
                isEmailInput = "email" === $field.prop("type"),
                everValidated,

                // AK: the craziest CSS's can modify the padding on focused controls. We must watch them.
                applyFocusedStyles = function() {
                    var copyFont = function($target) {
                            // AK TODO: we can copy this all as an array. This is quick shitcoding.
                        copyCSS($target, $field, [
                                // "font", // in Chrome this could be enough w/o Family and Weight. In FireFox we should copy each value.
                                "fontSize",
                                "fontFamily",
                                "fontStyle",
                                "fontWeight",
                                "fontVariant",

                                "lineHeight",
                                "wordSpacing",
                                "letterSpacing",
                                "textAlign",
                                "textTransform",
                                "textRendering",
                                // "textIndent", // it acts like left padding. We need it only for calculator but not for overlay. We display the suggested text together with primary text, without extra-intendation.

                                "cursor" // for sure that overlay has exactly the same cursor (if the $field using custom cursor)
                            ]);
                        },

                        textAlign = $field.css("textAlign");

                    if ("left" !== textAlign && "start" !== textAlign) {
                        me.restoreAlign = textAlign;
                        $field.css("textAlign", "left");
                    }

                    // copy styles only onFOCUS! We need paddings/margins of FOCUSED control only!
                    copyFont(me.$calcText);
                    copyFont(me.$suggOverlay);

                    //me.$suggOverlay.css("visibility", "visible");
                    // me.$suggOverlay.show();
                },

                validateInput = function() {
                    var validClass = options.validClass,
                        invalidClass = options.invalidClass,
                        invalidSyntaxClass = options.invalidSyntaxClass,

                        validShow = options.validShow,
                        invalidShow = options.invalidShow,
                        invalidSyntaxShow = options.invalidSyntaxShow,

                        val = $field[0].value,
                        hasValue = "" !== val,
                        isValidSyntax = !hasValue || (hasValue && val.isValidEmail()),
                        isValidEmail = isValidSyntax && (val !== $field.data("invalid-email")), // data-invalid-email is optional attribute.
                        isInvalidEmail = hasValue && !isValidEmail,

                        isValid = hasValue ? isValidEmail : undefined;

                    $field.data(STR_IS_VALID, isValid)
                          .data(STR_IS_INVALID_SYNTAX, !isValidSyntax)
                            .trigger("validate", isValid);

                    if (validClass)
                        $field.toggleClass(validClass, isValidEmail);
                    if (invalidSyntaxClass)
                        $field.toggleClass(invalidSyntaxClass, !isValidSyntax);
                    if (invalidClass)
                        $field.toggleClass(invalidClass, isInvalidEmail);

                    if (validShow)
                        $(validShow).toggle(isValidEmail);
                    if (invalidSyntaxShow)
                        $(invalidSyntaxShow).toggle(!isValidSyntax);
                    if (invalidShow)
                        $(invalidShow).toggle(isInvalidEmail && (!invalidSyntaxShow || isValidSyntax)); // just to not display 2 messages simultaniously

                    everValidated = true;
                };


            // parent should lock content in relative position, to allow absolute positioning of suggested term
            $field.parent().css("position", "relative");

            // capitalized emails looking TOTALLY weird when capitalized text torns apart, like Name@GmAil.Com etc. First character of suggested part will be capitalized too, and it's wrong.
            // And we will not respect unfocused capitalization too. First words in emails should never be capitaized.
            if ("capitalize" === $field.css("textTransform"))
                $field.css("textTransform", "lowercase");

            // create container to test width of current val
            me.$calcText = $("<span />").css({
                position: "absolute",
                visibility: "hidden",
                top: -999, // this will hide an element even if some weird CSS will enable visibility.
                display: "block",
                margin: 0, // we only calculate the width of the text. We don't need anything more. Set everything to 0 for sure.
                padding: 0,
                border: 0,
            }).insertAfter($field);

            // Create the suggestion overlay.
            me.$suggOverlay = $("<input "+(options.suggClass ? 'class="' + options.suggClass : "") + '" tabindex="-1" />').css({ // AK 29.11.2019. Since 29.02.2020 without CSP unsafe suggColor. Use only classes to style it!
                position: "absolute",
                display: "none",
                background: "transparent",
                top: 0,
                left: 0,
                margin: 0,
                padding: 0,
                border: 0,
                zIndex: 9999,
                overflow: "hidden",
                // pointerEvents: "none", // NO! We should be able to click on suggestion to auto-complete the input!

                // ...uncomment code below to debug...
                // backgroundColor: "yellow",
                // opacity: 0.8,
            }).insertAfter($field);

            // if already focued -- apply styles immediately. Regular onFocus will not be triggered.
            if ($field.is(":focus"))
                applyFocusedStyles();

            // bind events and handlers
            $field.on("keyup", $.proxy(me.displaySuggestion, me)

                ).on("keydown", function(e) {
                    if (me.suggestion) {
                        var key = e.keyCode || e.which;
                        if (((37 < key) && (41 > key)) || (13 === key)) { // top-right-bottom. Don't use 9 (TAB). It's like "blur".
                            if (13 === key) {
                                e.stopPropagation();
                                e.preventDefault();
                            }
                            me.autocomplete();
                        }
                    }

                }).on("blur", function() {
                    if (me.restoreAlign) {
                        $field.css("textAlign", me.restoreAlign);
                        me.restoreAlign = null;
                    }

                    if (options.completeOnBlur)
                        me.autocomplete();
                    else
                        me.$suggOverlay.hide(); // css("visibility", "hidden");

                // AK: the craziest CSS's can modify the padding on focused controls. We must watch them.
                //     I'm adding the watching for the focused elements, but keep in mind, that there is a lot more pseudo-classes,
                //     which can completely change the look of the control, eg :hover, :enabled/:disabled, :read-only, :default, :required, :fullscreen, :valid/:invalid and so forth.
                }).on("focus", function() {
                    applyFocusedStyles();
                    if (me.$suggOverlay.val())
                        me.$suggOverlay.show();

                });

            if (isEmailInput)
                $field.on("change", validateInput)
                      .on("input", function() { // AK 15.07.2022: remove invalid marks when user cleared input field.
                          if ("" === $field[0].value) { // && ($field.hasClass(options.invalidClass) || $field.hasClass(options.invalidSyntaxClass))) {
                              validateInput();
                          }
                      });

            // touchstart requires jQuery 1.7+
            me.$suggOverlay.on("mousedown touchstart", function() {
                me.autocomplete();
            });


            // fix existing value
            var val = $field.val();
            if (val) { // if field already have some value
                if (isEmailInput)
                    validateInput();
                // if we're focused -- move cursor to the end
                if ($field.is(":focus"))
                    $field[0].setSelectionRange(val.length, val.length);

                // ATTN: field can be filled later by outside script without triggering "change" event.
                // See https://stackoverflow.com/questions/4672505/why-does-the-jquery-change-event-not-trigger-when-i-set-the-value-of-a-select-us
                // So if you modify the value from outside -- please force trigger "change" event.
            }


            // allow submission of invalid input
            if (isEmailInput && !$field.data("allow-invalid-submit")) {
                // find the wrapper form and hook onSubmit...
                $field.closest("form").on("submit", function(e) {
                    if ($field.val() && !$field.hasClass("ignore-invalid")) { // we don't care about empty input. Set "required" to check it.
                        if (!everValidated)
                            validateInput();

                        if (!$field.data(STR_IS_VALID)) {
                            e.preventDefault();
                            e.stopImmediatePropagation(); // block all other "submit" hooks

                            var form = this,
                                badSyntaxMsg = $field.data("custom-syntax-validity") || options.validitySyntaxMessage;

                            $field[0].setCustomValidity(
                                badSyntaxMsg && $field.data(STR_IS_INVALID_SYNTAX)
                                    ? badSyntaxMsg
                                    : $field.data("custom-validity") || options.validityMessage);

                            $field.one("change input paste", function() { // once
                                this.setCustomValidity("");
                            });

                            if (!form.checkValidity()) {
                                if (form.reportValidity) { // modern browsers
                                    form.reportValidity();
                                }else { // Internet Explorer
                                    // Create the temporary button, click and remove it
                                    var btn = document.createElement("button");
                                    form.appendChild(btn);
                                    btn.click(); // Important! This is native .click()! Don't replace with jQuery's .trigger("click")!
                                    form.removeChild(btn);
                                }
                            }
                        }
                    }
                });
            }
        },

        suggest: function(str) {
            var strArr = str.split("@");
            if (1 < strArr.length) {
                str = strArr.pop();
                if (!str.length) {
                    return "";
                }
            }else {
                return "";
            }

            str = str.toLowerCase();
            var match = this._domains.filter(function(domain) {
                    return 0 === domain.indexOf(str);
                }).shift() || "";

            return match.replace(str, "");
        },

        /**
         * Displays the suggestion, handler for field keyup event
         */
        displaySuggestion: function(e) {
            var me = this,
                $field = me.$field,
                $sugg = me.$suggOverlay,
                $calc = me.$calcText,
                fieldPos = $field.position();

            // Both val & suggestion will be reused in autocomplete()
            if (me.suggestion = me.suggest(me.val = $field.val()))
                e.preventDefault();

            copyCSS($sugg, $field, [ "width", "height" /*, "padding", "border"*/ ]); // for some reason "padding" and border doesn't work properly on Firefox. We should calculate position in other way.

            // update suggested text
            $calc.text(me.val);
            $sugg.val(me.suggestion)
                 .show()
                 .css({
                    top: fieldPos.top +
                        fl0at0($field.css("marginTop")),
                    left: fieldPos.left +
                        fl0at0($field.css("marginLeft")) +
                        fl0at0($field.css("borderLeftWidth")) +
                        fl0at0($field.css("paddingLeft")) +
                        fl0at0($field.css("textIndent")) +
                        $calc.width()
                });
        },

        autocomplete: function() {
            var me = this;

            if (me.suggestion) {
                me.$suggOverlay.val("").hide();

                me.$field.val(me.val + me.suggestion)
                    .trigger("change") // AK 21.09.2020. We need it to validate field immediately after auto-completion. It's normal "change". It's okay. No additional events required. UPD. before 17.04.2021 "input" triggered instead.
                    .trigger("autocomplete");

                // wait while mousedown/click on $suggOverlay is processed.
                setTimeout(function() {
                    me.$field.trigger("focus");
                });
            }
        },
    };

    $.fn[pluginName] = function(options) {
        return this.each(function() {
            if (!$.data(this, pluginName)) { // avoid double initializaton
                $.data(this, pluginName, new emailAutocomplete(this, options));
            }
        });
    };

})(jQuery, window, document);


$('input[type="email"],input.email-autocomplete').emailautocomplete(); // .email-autocomplete class should be specified in type="text" fields. Eg in sign-in forms, for fields to provide either username or email.

/* or
 $('input[type="email"], input.email-autocomplete').each(function() { // .email-autocomplete class should be specified in type="text" fields. Eg sign-in forms, field to provide either username or email.
     $(this).emailautocomplete(); // { domains: ["example.com"] });
 });

    Sometimes I have troubles with initialization inside of the legacy Yahoo YUI dialogs.
    (Not everywhere. It works great with contact editor, but does not works on requesting required fields after incomplete registration on FAVOR.com.ua)

    But if you any have troubles, you need force initialization after first render() of the dialog.
    Example:

      YAHOO.example.container.reqflddlg.render()

      $("#reqflddlg").css("display","")
         .find('input[type="email"]').emailautocomplete();
*/