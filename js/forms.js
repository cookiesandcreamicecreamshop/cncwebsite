/* Sends the newsletter and party forms to the endpoints set in js/config.js. */
(function () {
  var PKG = { social: 'Scoops Package', cake: 'Sundaes Package', takeover: 'Full Takeover Package' };

  function send(url, data) {
    return fetch(url, {
      method: 'POST',
      // Google Apps Script only accepts "simple" requests, so send plain text there
      headers: /script\.google\.com/.test(url) ? { 'Content-Type': 'text/plain;charset=utf-8' } : { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r; });
  }

  window.ccWrapForms = function (Component, page) {
    var base = Component.prototype.renderVals;
    Component.prototype.renderVals = function () {
      var out = base.call(this), self = this, s = this.state || {}, cfg = window.CC_CONFIG || {};
      if (out.popSubmit) {
        out.popSubmit = function (e) {
          if (e && e.preventDefault) e.preventDefault();
          var form = e && e.target && e.target.closest ? e.target.closest('form') : null;
          var input = form ? form.querySelector('input[type=email]') : null;
          var email = (input && input.value) || s.popEmail || '';
          if (!cfg.newsletterEndpoint) { self.setState({ popDone: true }); return; }
          send(cfg.newsletterEndpoint, { form: 'newsletter', email: email, page: page })
            .then(function () { self.setState({ popDone: true }); })
            .catch(function () { alert('Sorry, that didn’t go through. Please try again.'); });
        };
      }
      if (out.sendParty) {
        out.sendParty = function () {
          if (!s.pEmail && !s.pPhone) { alert('Please add an email or phone number so we can confirm your party.'); return; }
          var data = { form: 'party', name: s.pName || '', email: s.pEmail || '', phone: s.pPhone || '',
            date: s.pDate || '', guests: s.guests, package: PKG[s.pkg] || s.pkg, location: '929 Elmwood Ave' };
          if (!cfg.partyEndpoint) { self.setState({ partySent: true }); return; }
          send(cfg.partyEndpoint, data)
            .then(function () { self.setState({ partySent: true }); })
            .catch(function () { alert('Sorry, your request didn’t go through. Please try again or call us.'); });
        };
      }
      return out;
    };
    return Component;
  };
})();
