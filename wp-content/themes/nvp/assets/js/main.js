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

/* ---------- Lightbox: zvětšení fotky produktu ---------- */
(function () {
	var gallery = document.querySelector('[data-gallery]');
	if (!gallery) return;
	var zoom = gallery.querySelector('[data-zoom]');
	if (!zoom) return;
	var thumbs = Array.prototype.slice.call(gallery.querySelectorAll('.thumb[data-full]'));
	var list = thumbs.length ? thumbs.map(function (t) { return t.dataset.full; }) : [zoom.dataset.full];
	var idx = 0, box = null, img, count;

	function build() {
		box = document.createElement('div');
		box.className = 'lightbox' + (list.length < 2 ? ' lightbox--single' : '');
		box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Zvětšená fotografie');
		box.innerHTML = '<img class="lightbox__img" alt="">' +
			'<button type="button" class="lightbox__btn lightbox__close" aria-label="Zavřít"><svg class="nvp-ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
			'<button type="button" class="lightbox__btn lightbox__prev" aria-label="Předchozí"><svg class="nvp-ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg></button>' +
			'<button type="button" class="lightbox__btn lightbox__next" aria-label="Další"><svg class="nvp-ico" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg></button>' +
			'<span class="lightbox__count"></span>';
		document.body.appendChild(box);
		img = box.querySelector('.lightbox__img'); count = box.querySelector('.lightbox__count');
		box.addEventListener('click', function (e) {
			if (e.target.closest('.lightbox__close') || e.target === box) close();
			else if (e.target.closest('.lightbox__prev')) go(-1);
			else if (e.target.closest('.lightbox__next')) go(1);
		});
	}
	function show(i) { idx = (i + list.length) % list.length; img.src = list[idx]; count.textContent = (idx + 1) + ' / ' + list.length; }
	function go(d) { show(idx + d); }
	function open(i) { if (!box) build(); show(i); box.classList.add('is-open'); document.body.classList.add('lb-open'); box.querySelector('.lightbox__close').focus(); }
	function close() { if (box) box.classList.remove('is-open'); document.body.classList.remove('lb-open'); zoom.focus(); }

	zoom.addEventListener('click', function () {
		var active = thumbs.findIndex(function (t) { return t.classList.contains('is-active'); });
		open(active > -1 ? active : 0);
	});
	document.addEventListener('keydown', function (e) {
		if (!box || !box.classList.contains('is-open')) return;
		if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1);
	});
	// šipky + tažení prstem
	var sx = null;
	document.addEventListener('touchstart', function (e) { if (box && box.classList.contains('is-open')) sx = e.touches[0].clientX; }, { passive: true });
	document.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50 && list.length > 1) go(dx < 0 ? 1 : -1); }, { passive: true });

	// při přepnutí náhledu nastavit i „hlavní“ fotku pro rozklik
	thumbs.forEach(function (t) { t.addEventListener('click', function () { zoom.dataset.full = t.dataset.full; }); });
})();
