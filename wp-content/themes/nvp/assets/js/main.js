/* NV Products – frontend */
(function () {
	'use strict';
	var $ = window.jQuery;
	var body = document.body;
	var T = (window.NVP && window.NVP.thickness) || {};

	/* ---------- Mobilní menu ---------- */
	var burger = document.querySelector('[data-toggle-nav]');
	if (burger) {
		burger.addEventListener('click', function () {
			var open = body.classList.toggle('nav-open');
			burger.setAttribute('aria-expanded', open ? 'true' : 'false');
		});
		document.querySelectorAll('#nav a').forEach(function (a) {
			a.addEventListener('click', function () { body.classList.remove('nav-open'); burger.setAttribute('aria-expanded', 'false'); });
		});
	}

	/* ---------- Hlavička – stín po odscrollování ---------- */
	var header = document.querySelector('.site-header');
	function onScroll() { if (header) header.classList.toggle('is-stuck', window.scrollY > 8); }
	window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

	/* ---------- Výsuvný košík ---------- */
	var drawer = document.getElementById('cart-drawer');
	var overlay = document.querySelector('.drawer-overlay');
	function openCart() {
		if (!drawer) return;
		body.classList.add('cart-open');
		drawer.setAttribute('aria-hidden', 'false');
		if (overlay) overlay.hidden = false;
	}
	function closeCart() {
		if (!drawer) return;
		body.classList.remove('cart-open');
		drawer.setAttribute('aria-hidden', 'true');
		if (overlay) overlay.hidden = true;
	}
	document.addEventListener('click', function (e) {
		if (e.target.closest('[data-open-cart]')) { e.preventDefault(); openCart(); }
		else if (e.target.closest('[data-close-cart]')) { closeCart(); }
	});
	document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); });
	if ($) $(document.body).on('added_to_cart', openCart);
	// Po přidání na detailu (stránka se načte znovu s hláškou) košík rovnou ukážeme.
	if (document.querySelector('.pdp .woocommerce-message, .pdp .wc-block-components-notice-banner.is-success')) {
		setTimeout(openCart, 250);
	}

	/* ---------- Galerie produktu ---------- */
	document.querySelectorAll('[data-gallery]').forEach(function (g) {
		var main = g.querySelector('#gallery-main');
		g.querySelectorAll('.thumb').forEach(function (t) {
			t.addEventListener('click', function () {
				g.querySelectorAll('.thumb').forEach(function (x) { x.classList.remove('is-active'); });
				t.classList.add('is-active');
				if (main) { main.src = t.dataset.src; if (t.dataset.srcset) main.srcset = t.dataset.srcset; }
			});
		});
	});

	/* ---------- Množství +/- ---------- */
	document.addEventListener('click', function (e) {
		var b = e.target.closest('[data-qty]');
		if (!b) return;
		var input = b.parentElement.querySelector('input.qty, input[type=number]');
		if (!input) return;
		var step = parseFloat(input.step) || 1, min = parseFloat(input.min) || 0;
		var max = parseFloat(input.max); var v = (parseFloat(input.value) || 0) + step * parseInt(b.dataset.qty, 10);
		if (v < min) v = min; if (!isNaN(max) && max > 0 && v > max) v = max;
		input.value = v;
		input.dispatchEvent(new Event('change', { bubbles: true }));
		if ($) $(input).trigger('change');
	});

	/* ---------- Konfigurátor multiholderu ---------- */
	function fmtMm(mm) { return String(mm).replace('.', ',') + ' mm'; }
	function ptNum(v) { var m = /(\d+)/.exec(v || ''); return m ? m[1] : null; }

	document.querySelectorAll('form.config').forEach(function (form) {
		var rows = Array.prototype.slice.call(form.querySelectorAll('.config__row'));
		var stack = form.querySelector('[data-stack] .stack__body');
		var hint = form.querySelector('[data-hint]');
		var slots = parseInt(form.dataset.slots, 10) || 0;
		var positional = form.dataset.positional === '1';

		function select(row) { return row.querySelector('select'); }
		function value(row) { return select(row).value; }
		function setValue(row, v) {
			var s = select(row); s.value = v;
			if ($) $(s).trigger('change'); else s.dispatchEvent(new Event('change', { bubbles: true }));
		}

		function renderStack() {
			if (!stack) return;
			var items = [];
			if (positional) rows.forEach(function (r) { items.push(value(r)); });
			else for (var i = 0; i < slots; i++) items.push(rows[0] ? value(rows[0]) : '');
			stack.innerHTML = '';
			items.forEach(function (v, i) {
				var n = ptNum(v), mm = n ? T[n] : null;
				var el = document.createElement('div');
				el.className = 'slot' + (mm ? '' : ' slot--empty');
				el.style.setProperty('--h', mm || 3);
				el.innerHTML = mm ? '<span>' + n + ' pt</span><i>' + fmtMm(mm) + '</i>' : '<span>' + (i + 1) + '</span>';
				el.title = mm ? (i + 1) + '. karta: ' + n + ' pt (' + fmtMm(mm) + ')' : (i + 1) + '. karta – zatím nevybráno';
				stack.appendChild(el);
			});
		}

		function renderHint() {
			if (!hint) return;
			var empty = rows.filter(function (r) { return !value(r); });
			if (empty.length) {
				var legend = empty[0].querySelector('legend');
				var label = legend ? legend.childNodes[0].textContent.trim().split(' –')[0] : 'možnost';
				hint.textContent = positional
					? 'Vyberte tloušťku pro ' + label.toLowerCase().replace('pozice', 'pozici') + ' (' + (rows.length - empty.length) + ' z ' + rows.length + ' hotovo)'
					: 'Vyberte: ' + label.toLowerCase();
				hint.classList.remove('is-ready');
			} else {
				var parts = rows.map(function (r) { var n = ptNum(value(r)); return n ? n + ' pt' : value(r); });
				hint.textContent = positional ? 'Sestava: ' + parts.join(' · ') : (slots ? slots + '× ' : '') + parts.join(' · ');
				hint.classList.add('is-ready');
			}
		}

		function sync() {
			rows.forEach(function (r) {
				var v = value(r);
				r.querySelectorAll('.opt').forEach(function (b) {
					var on = b.dataset.value === v;
					b.classList.toggle('is-on', on);
					b.setAttribute('aria-pressed', on ? 'true' : 'false');
				});
			});
			renderStack(); renderHint();
		}

		form.addEventListener('click', function (e) {
			var opt = e.target.closest('.opt');
			if (opt) {
				var row = opt.closest('.config__row');
				var v = opt.dataset.value;
				setValue(row, value(row) === v ? '' : v);
				setTimeout(sync, 0);
				return;
			}
			if (e.target.closest('[data-copy-first]')) {
				var row2 = e.target.closest('.config__row');
				if (value(rows[0])) { setValue(row2, value(rows[0])); setTimeout(sync, 0); }
			}
		});

		if ($) $(form).on('reset_data found_variation check_variations woocommerce_variation_has_changed hide_variation show_variation', function () { setTimeout(sync, 0); });
		sync();
	});
})();
