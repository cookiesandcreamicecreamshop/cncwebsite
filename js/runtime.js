/* Cookies & Cream — tiny page runtime.
   Renders each page's template (the markup inside <template id="page">) with the
   values from its Component's renderVals(), and re-renders when setState() is called. */
(function () {
  'use strict';

  window.DCLogic = class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(patch) {
      if (typeof patch === 'function') patch = patch(this.state, this.props);
      if (!patch) return;
      Object.assign(this.state, patch);
      if (this.__render) this.__render();
    }
    forceUpdate() { if (this.__render) this.__render(); }
  };

  var HOLE = /\{\{\s*([A-Za-z_$][\w$.]*)\s*\}\}/g;
  var FULL = /^\s*\{\{\s*([A-Za-z_$][\w$.]*)\s*\}\}\s*$/;

  function lookup(vals, path) {
    var parts = path.split('.'), v = vals;
    for (var i = 0; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
    return v;
  }
  function str(v) { return v == null || v === false ? '' : String(v); }
  function fill(tpl, vals) { return tpl.replace(HOLE, function (_, k) { return str(lookup(vals, k)); }); }

  var EVENTS = { onclick: 'click', onsubmit: 'submit', onfocus: 'focusin', onblur: 'focusout',
    onmousemove: 'mousemove', onmouseleave: 'mouseleave', onmouseenter: 'mouseenter',
    onkeydown: 'keydown', onkeyup: 'keyup', oninput: 'input', onpointerdown: 'pointerdown' };

  function compile(root, bindings, skipIf) {
    var walker = [], node;
    (function walk(parent) {
      var kids = Array.prototype.slice.call(parent.childNodes);
      for (var i = 0; i < kids.length; i++) {
        var n = kids[i];
        if (n.nodeType === 3) {
          if (n.nodeValue.indexOf('{{') >= 0) bindings.push({ t: 'text', n: n, tpl: n.nodeValue });
          continue;
        }
        if (n.nodeType !== 1) continue;
        if (n.tagName === 'SC-IF') {
          var m = FULL.exec(n.getAttribute('value') || '');
          var key = m ? m[1] : '';
          if (skipIf && skipIf(key)) { n.remove(); continue; }
          var anchor = document.createComment('if ' + key);
          var frag = document.createDocumentFragment();
          while (n.firstChild) frag.appendChild(n.firstChild);
          walk(frag);
          var nodes = Array.prototype.slice.call(frag.childNodes);
          n.replaceWith(anchor);
          bindings.push({ t: 'if', key: key, anchor: anchor, nodes: nodes, frag: frag, shown: false });
          continue;
        }
        var attrs = Array.prototype.slice.call(n.attributes);
        for (var a = 0; a < attrs.length; a++) {
          var name = attrs[a].name, val = attrs[a].value;
          if (name === 'hint-placeholder-val') { n.removeAttribute(name); continue; }
          if (val.indexOf('{{') < 0) continue;
          var full = FULL.exec(val);
          if (name.indexOf('on') === 0 && full) {
            n.removeAttribute(name);
            var ev = EVENTS[name];
            if (name === 'onchange') ev = (n.tagName === 'SELECT' || n.type === 'checkbox' || n.type === 'radio' || n.type === 'date') ? 'change' : 'input';
            if (!ev) ev = name.slice(2);
            bindings.push({ t: 'ev', n: n, ev: ev, key: full[1] });
            if (name === 'onchange' && n.type === 'date') bindings.push({ t: 'ev', n: n, ev: 'input', key: full[1] });
            continue;
          }
          if (name === 'ref' && full) { n.removeAttribute(name); bindings.push({ t: 'ref', n: n, key: full[1] }); continue; }
          n.removeAttribute(name);
          bindings.push({ t: 'attr', n: n, name: name, tpl: val, full: full ? full[1] : null });
        }
        walk(n);
      }
    })(root);
  }

  function apply(b, vals) {
    if (b.t === 'text') { var s = fill(b.tpl, vals); if (b.n.nodeValue !== s) b.n.nodeValue = s; return; }
    if (b.t === 'attr') {
      if (b.name === 'value' && ('value' in b.n)) {
        var v = b.full ? str(lookup(vals, b.full)) : fill(b.tpl, vals);
        if (document.activeElement !== b.n && b.n.value !== v) b.n.value = v;
        return;
      }
      if (b.full) {
        var raw = lookup(vals, b.full);
        if (raw === false || raw == null) { b.n.removeAttribute(b.name); return; }
        if (raw === true) { b.n.setAttribute(b.name, ''); return; }
      }
      var out = fill(b.tpl, vals);
      if (b.n.getAttribute(b.name) !== out) b.n.setAttribute(b.name, out);
      return;
    }
    if (b.t === 'if') {
      var on = !!lookup(vals, b.key);
      if (!b.anchor.parentNode) return;
      if (on && !b.shown) {
        var f = document.createDocumentFragment();
        b.nodes.forEach(function (x) { f.appendChild(x); });
        b.anchor.parentNode.insertBefore(f, b.anchor.nextSibling);
        b.shown = true;
      } else if (!on && b.shown) {
        b.nodes.forEach(function (x) { if (x.parentNode) x.parentNode.removeChild(x); });
        b.shown = false;
      }
    }
  }

  window.mountPage = function (Component, opts) {
    opts = opts || {};
    var tpl = document.getElementById('page');
    var host = document.getElementById('app');
    var props = {};
    try {
      var defs = JSON.parse(tpl.getAttribute('data-props') || '{}');
      Object.keys(defs).forEach(function (k) { if (k[0] !== '$' && defs[k] && 'default' in defs[k]) props[k] = defs[k]['default']; });
    } catch (e) {}
    var comp = new Component(props);
    var frag = tpl.content.cloneNode(true);
    var bindings = [];
    compile(frag, bindings, opts.skipIf);
    host.appendChild(frag);

    var vals = {};
    var listeners = bindings.filter(function (b) { return b.t === 'ev'; });
    listeners.forEach(function (b) {
      b.n.addEventListener(b.ev, function (e) {
        var fn = vals[b.key];
        if (typeof fn === 'function') fn.call(comp, e);
      });
    });

    var queued = false, mounted = false;
    function render() {
      vals = comp.renderVals() || {};
      // apply structural (if) bindings first, outer before inner
      bindings.filter(function (b) { return b.t === 'if'; }).reverse().forEach(function (b) { apply(b, vals); });
      bindings.forEach(function (b) { if (b.t !== 'if' && b.t !== 'ev' && b.t !== 'ref') apply(b, vals); });
      if (!mounted) bindings.forEach(function (b) { if (b.t === 'ref' && typeof vals[b.key] === 'function') vals[b.key].call(comp, b.n); });
    }
    comp.__render = function () {
      if (queued) return;
      queued = true;
      Promise.resolve().then(function () { queued = false; render(); if (comp.componentDidUpdate) comp.componentDidUpdate(); });
    };
    render();
    mounted = true;
    if (comp.componentDidMount) comp.componentDidMount();
    return comp;
  };
})();
