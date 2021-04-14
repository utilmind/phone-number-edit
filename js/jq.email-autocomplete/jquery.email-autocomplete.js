/*
 *  email-autocomplete - 0.3 (forked from original code by by Low Yong Zhen  v0.1.3)
 *  jQuery plugin that displays in-place autocomplete suggestions for email input fields.
 *
 *
 *  Made by Low Yong Zhen <yz@stargate.io>
 *  Modified by Aleksey Kuznietsov <utilmind@gmail> 29.11.2019 — 24.01.2020, 10.04.2021 (v0.3).
 *
 *
 *  AK NOTES:
 *    1. It works in all modern browsers, including Internet Explorer 11. (Didn't tested it with older IE's.)
 *    2. I have dropped support of legacy functionality. ECMAScript 5 (released in 2009) required to run this code.
 *       See Array.indexOf(), Array.isArray(), Array.forEach() etc. I could rewrite it with legacy code, but don't want to do this.
 *
 */
(function($, window, document, undefined) {
  "use strict";

  var pluginName = "emailautocomplete",
      defaults = {
        suggClass: "tt-hint", // "eac-sugg", // AK original classname, but I prefer to use just simple color. Some time ago here was "suggColor", but inline styles are unsafe for CSP, so let's use only class.
        domains: [], // add custom domains here
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

/* Ukraine + Europe */
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
          "gala.net",		// UA
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
      }; // end of defaults

  // AK: it's good enough to be canonized somewhere separately
  function copyCSS(targetEl, sourceElOrVal, styleName) {
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
  }

  // we already have fl0at() in utilmind's commons.js, but this script could be loaded before commons. Let's make it little bit more independant.
  function fl0at(v, def) { // same as parseFloat, but returns 0 if parseFloat returns non-numerical value
      return isNaN(v = parseFloat(v))
          ? def || 0
          : v;
  }

  function emailAutocomplete(input, options) {
      var me = this,
          $field = me.$field = $(input),
          inputDomains = $field.data("domains");

      me.options = $.extend({}, defaults, options);

      inputDomains = inputDomains
          ? inputDomains.split(",").map(function(s) { return s.trim(); }) // trim all domains
          : [];

      me._domains = me.options.domains
          .concat(inputDomains,
                  me.options.defDomains); // arrays with domains, default + 2nd priority default and custom lists

      me.init();
  }

  emailAutocomplete.prototype = {
    init: function() {
      var me = this,
          $field = me.$field,

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

                    "cursor", // for sure that overlay has exactly the same cursor (if the $field using custom cursor)
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

            me.$suggOverlay.css("visibility", "visible");
          };

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
      me.$suggOverlay = $("<input "+(me.options.suggClass ? 'class="' + me.options.suggClass : "") + '" tabindex="-1" />').css({ // AK 29.11.2019. Since 29.02.2020 without CSP unsafe suggColor. Use only classes to style it!
        position: "absolute",
        display: "block",
        background: "transparent",
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
        border: 0,
        zIndex: 9999,
        overflow: "hidden",

        // ...uncomment code below to debug...
        // backgroundColor: "yellow",
        // opacity: 0.8,
      }).insertAfter($field);

      // if already focued -- apply styles immediately. Regular onFocus will not be triggered.
      if ($field.is(":focus"))
        applyFocusedStyles();

      // bind events and handlers
      $field.on("keyup", $.proxy(me.displaySuggestion, me))

            .on("keydown", $.proxy(function(e) {
                if (me.suggestion) {
                  var key = e.keyCode || e.which;
                  if (((37 < key) && (41 > key)) || (9 === key) || (13 === key)) { // top-right-bottom & tab
                    if (13 === key) {
                      e.stopPropagation();
                      e.preventDefault();
                    }
                    me.autocomplete();
                  }
                }
              }, me))

            .on("blur", $.proxy(function(e) {
                if (me.restoreAlign) {
                    $field.css("textAlign", me.restoreAlign);
                    me.restoreAlign = null;
                }

                me.$suggOverlay.css("visibility", "hidden");
                me.autocomplete();
              }, me))

            // AK: the craziest CSS's can modify the padding on focused controls. We must watch them.
            //     I'm adding the watching for the focused elements, but keep in mind, that there is a lot more pseudo-classes,
            //     which can completely change the look of the control, eg :hover, :enabled/:disabled, :read-only, :default, :required, :fullscreen, :valid/:invalid and so forth.
            .on("focus", $.proxy(applyFocusedStyles, me));

      // touchstart jquery 1.7+
      me.$suggOverlay.on("mousedown touchstart", $.proxy(me.autocomplete, me));
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
        // $sugg.css("borderColor", "transparent");

        // update suggested text
        $calc.text(me.val);
        $sugg.val(me.suggestion);

        $sugg.css("top",
            fieldPos.top +
            fl0at($field.css("marginTop"))
            //fl0at($field.css("borderTopWidth")) +
            //fl0at($field.css("paddingTop"))
        );

        $sugg.css("left",
            fieldPos.left +
            fl0at($field.css("marginLeft")) +
            fl0at($field.css("borderLeftWidth")) +
            fl0at($field.css("paddingLeft")) +
            fl0at($field.css("textIndent")) +
            $calc.width()
        );
    },

    autocomplete: function() {
        var me = this;
        if (me.suggestion) {
            me.$field.val(me.val + me.suggestion);
            me.$suggOverlay.text("");
            // me.$calcText.text("");

            me.$field.trigger("input"); // AK 21.09.2020. We need it to validate field immediately after auto-completion. It's normal "input". It's okay. No additional events required.
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


doInit(function() { // make autocompleable all emails on page
    if ("undefined" === typeof $) return 1;
    $('input[type="email"], input.email-autocomplete').emailautocomplete(); // .email-autocomplete class should be specified in type="text" fields. Eg in sign-in forms, for fields to provide either username or email.
    /* or
    $('input[type="email"], input.email-autocomplete').each(function() { // .email-autocomplete class should be specified in type="text" fields. Eg sign-in forms, field to provide either username or email.
        $(this).emailautocomplete(); // { domains: ["example.com"] });
    });
    */
}, 1);

/*
    Sometimes I have troubles with initialization inside of the legacy Yahoo YUI dialogs.
    (Not everywhere. It works great with contact editor, but does not works on requesting required fields after incomplete registration on FAVOR.com.ua)

    But if you any have troubles, you need force initialization after first render() of the dialog.
    Example:

      YAHOO.example.container.reqflddlg.render()

      $("#reqflddlg").css("display","")
         .find('input[type="email"]').emailautocomplete();
*/