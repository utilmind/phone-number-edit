# Phone number editor demo
 Phone number editor demo

### Live demo

https://utilmind.com/demos/2021/phone-number-edit/

### Description

Requirement: jQuery plugin for input controls, that allows to format on the fly phone numbers by specified pattern.

Originally made only for the American and Canadian phone patterns, (XXX) XXX-XXXX, but greatly improved in v0.1,
to allow any particular patterns specified as "<b>data-pattern</b>" attribute of input control. There is also "<b>data-min-pattern-length</b>" parameter, used to specify minimum number of digits required to transform the input into nice number by pattern.

Examples:<ul>

<li>USA and Canada:<br />
<code>
&lt;input type="tel" data-pattern="<b>(XXX) XXX-XXXX</b>" data-min-pattern-length="2"
                name="phone" id="dlg_phone" class="form-control place-bi"
                placeholder="(XXX) XXX-XXXX for the USA or +XX ... for international number" spellcheck="false" maxlength="32" required autofocus /&gt;
</code></li>
<li>Ukraine<br />
<code>
&lt;input type="tel" data-pattern="<b>(0XX) XXX-XX-XX</b>" data-min-pattern-length="2"
                name="phone" id="dlg_phone" class="form-control place-bi"
                placeholder="(XX) XXX-XX-XX for Ukraine or +XX ... for international number" spellcheck="false" maxlength="32" required autofocus /&gt;
</code></li>
</ul>

...and starting from v0.2 it supports multiple patterns. For example, here is phone pattern Belgium phone numbers, with 2 or 3-digits area code + 7 or 6-digits phone numbers, depending on the area code:
<ul>
<li><code>&lt;input type="tel" data-pattern="<b>0XX/XX XX XX; 2,3,4,9:0X/XXX XX XX</b>" data-min-pattern-length="2"
                name="phone" id="dlg_phone" class="form-control place-bi"
                placeholder="XX XX XX XX for Belgium or +XX ... for international number" spellcheck="false" maxlength="32" required autofocus /&gt;</code>
<br />Standard pattern is 0XX/XX XX XX (2 digits area code + 6 digits number, with leading zero allowed), however several area codes, like 2&nbsp;(Brussels), 3&nbsp;(Antwerp), 4&nbsp;(Liège) and 9&nbsp;(Ghent) have 7-digit numbers: 0X/XXX XX XX.
</li>
</ul>


### ALSO

We have several SQL functions (compatible at least with MySQL/MariaDB, work on MySQL 5.X), that can natively format phone numbers by pattern right in the table triggers. Take a look in the "sql" directory for the following functions:
  * <code>is_good_phone(phone, local_phone_length, local_country_code)</code> — validate the phone number, returns TRUE (1) if entered in correct format and FALSE (0) otherwise. Mostly used to validate local phone numbers without "+" (prefix of internation numbers). It check out required number of digits, specfied by <code>local_phone_length</code> parameter. But also it can automatically validate some internation numbers, such like USA/Canada (+1), Australia (+61), Mexico (+52), India (+91), China (+86), Ukraine (+380), etc.
  * <code>nice_phone_number(phone, local_phone_pattern, local_country_code, add_local_country_code)</code> — make nice looking phone number by specified pattern. Prepare number only by the pattern specified by <code>local_phone_pattern</code>. Does not touch international phone numbers, that differs from <code>local_country_code</code>.
  * <code>patternize(str, pattern, pattern_char, rtl, trim_to_pattern)</code> — put the characters from string into specified pattern. Patterns may have any custom formats, like "[CCC]-(CCC)-{CCC}", where C is the <code>pattern_char</code>. <code>rtl</code> used to specify is right-to-left direction of processing, <code>trim_to_pattern</code> can be used to remove or leave extra-characters that exceed the length of pattern.
  * <code>leave_allowed_chars()</code> — remove all characters from string except specified set of allowed characters.
  * <code>leave_numbers(str)</code> — strips all characters from string except digits (from 0 to 9). Does not use regular expressions, compatible with mySQL 5.x
  * <code>leave_numbers_regexp(str)</code> — same as leave_numbers(), but use regular expressions, so works on mySQL 8.x+.
  * <code>count_chars_in_str(str, ch)</code> — returns the number of occurances of some specific character in string

### email-autocomplete

Demo has input control for email with auto-completion of domain name. See it @ https://github.com/utilmind/email-autocomplete
