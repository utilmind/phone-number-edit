# Phone number editor demo
 Phone number editor demo

### Live demo

https://utilmind.com/demos/2021/phone-number-edit/

### Description

Requirement: jQuery plugin for input controls, that allows to format on the fly phone numbers by specified pattern.

Originally made only for the American and Canadian phone patterns, (XXX) XXX-XXXX, but greatly improved in v0.1,
to allow any particular patterns specified as "data-pattern" attribute of input control.

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
<br />Standard pattern is 0XX/XX XX XX (2 digits area code + 6 digits number, with leading zero allowed), however several area codes 2 (Brussels), 3 (Antwerp), 4 (Liège) and 9 (Ghent) have 7-digit numbers: 0X/XXX XX XX.
</li>
</ul>
