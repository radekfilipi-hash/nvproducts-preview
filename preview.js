/* Náhledový režim: objednávání je vypnuté, zbytek webu (včetně konfigurátoru) funguje. */
(function () {
	var b = document.createElement('div');
	b.className = 'pv-banner';
	b.innerHTML = 'Statický náhled redesignu – objednávání funguje až na ostrém webu.<button type="button">Rozumím</button>';
	b.querySelector('button').onclick = function () { b.remove(); };
	document.body.appendChild(b);
	var t;
	function toast() {
		var x = document.querySelector('.pv-toast') || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'pv-toast' }));
		x.textContent = 'Náhled: objednávání je vypnuté. Konfigurátor si ale můžete vyzkoušet.';
		clearTimeout(t); t = setTimeout(function () { x.remove(); }, 3200);
	}
	function block(e) { e.preventDefault(); e.stopImmediatePropagation(); toast(); }
	window.addEventListener('submit', function (e) { if (e.target.matches('form.cart, form.checkout, .woocommerce-cart-form, form.contact-form, form.form')) block(e); }, true);
	window.addEventListener('click', function (e) {
		if (e.target.closest('.ajax_add_to_cart, .checkout-button, #place_order, .single_add_to_cart_button, .woocommerce-mini-cart__buttons .button')) block(e);
	}, true);
})();
