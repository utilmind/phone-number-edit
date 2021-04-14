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
<input type="tel" data-pattern="(XXX) XXX-XXXX" data-min-pattern-length="2"
                name="phone" id="dlg_phone" class="form-control place-bi"
                placeholder="(XXX) XXX-XXXX for the USA or +XX ... for international number" spellcheck="false" maxlength="32" required autofocus />
</code>
</li>
<li>Ukraine<br />
<code>
&lt;input type="tel" data-pattern="<b>(0XX) XXX-XX-XX</b>" data-min-pattern-length="2"
                name="phone" id="dlg_phone" class="form-control place-bi"
                placeholder="(XX) XXX-XX-XX for Ukraine or +XX ... for international number" spellcheck="false" maxlength="32" required autofocus /&gt;
</code>
</li>
