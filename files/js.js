var zkSlides = {};

function zkCheckSlides() {
	var slides = document.querySelectorAll('.zkslide');
	for (var i in slides) {
		if (!slides.hasOwnProperty(i)) continue;
		if (slides[i].getAttribute('data-zkslide-set')) continue;

		if (slides[i].getAttribute('data-id')) {
			var k = slides[i].getAttribute('data-id');
			if (parseInt(k).toString() == k) {
				alert('The slide id cannot be numeric.');
				continue;
			}
			if (typeof zkSlides[k] !== 'undefined') {
				alert('Duplicated slide id ' + k + '.');
				continue;
			}
		} else {
			var k = 1;
			while (typeof zkSlides[k] !== 'undefined')
				k++;
		}

		var options = {
			'width': null,
			'height': null,
			'type': 'slide',
			'direction': 'o',
			'force-width': 'true',
			'force-height': 'true',
			'visible': 1,
			'interval': false,
			'step': 1,
			'callback': false
		};

		for (var opt in options) {
			if (!options.hasOwnProperty(opt)) continue;
			if (slides[i].getAttribute('data-' + opt)) {
				switch (opt) {
					case 'visible':
						options[opt] = JSON.parse(slides[i].getAttribute('data-' + opt));
						if (typeof options[opt] === 'object') {
							if (typeof options[opt]['default'] === 'undefined') {
								console.error('Default value, in the slider option "visible", must be present');
								options[opt] = 1;
							}
						}
						break;
					case 'callback':
						eval("options[opt] = " + slides[i].getAttribute('data-' + opt));
						break;
					default:
						options[opt] = slides[i].getAttribute('data-' + opt);
						break;
				}
			}
		}

		slides[i].style.display = 'block';
		if (slides[i].offsetParent === null) {
			slides[i].style.display = 'none';
			continue;
		}

		var subslides = [];
		while (typeof slides[i].children[0] !== 'undefined') {
			subslides.push(slides[i].removeChild(slides[i].children[0]));
		}

		switch (options['type']) {
			case 'slide':
				var cont = document.createElement('div');
				switch (options['direction']) {
					case 'o':
						cont.className = 'zkslide-inner horizontal';
						break;
					case 'v':
						cont.className = 'zkslide-inner vertical';
						break;
				}
				cont.setAttribute('data-default-class', cont.className);
				cont.style.top = '0px';
				cont.style.left = '0px';
				cont = slides[i].appendChild(cont);
				break;
			case 'fade':
				var cont = slides[i];
				break;
		}

		if (options['width'] !== null)
			slides[i].style.width = options['width'];
		if (options['height'] !== null)
			slides[i].style.height = options['height'];

		zkSlides[k] = {
			'mainCont': slides[i],
			'cont': cont,
			'options': options,
			'slides': subslides,
			'current': 1,
			'queue': [],
			'moving': false,
			'interval': false
		};

		slides[i].setAttribute('data-zkslide-set', k);

		zkFillStaticSlide(k, zkSlides[k].current);

		if (zkSlides[k].options['callback']) {
			zkSlides[k].options['callback'].call(zkSlides[k], zkSlides[k].current);
		}

		zkSlideSetInterval(k);
	}
}

window.addEventListener('DOMContentLoaded', zkCheckSlides);
if (typeof window.onHtmlChange !== 'undefined')
	onHtmlChange(zkCheckSlides);
window.addEventListener('resize', zkSlideDebounce(function () {
	for (var k in zkSlides) {
		if (!zkSlides.hasOwnProperty(k)) continue;
		zkFillStaticSlide(k, zkSlides[k].current);
	}
}, 100));

function zkSlideSetOptions(k, options) {
	if (typeof zkSlides[k] === 'undefined')
		return false;
	for (var i in options) {
		if (!options.hasOwnProperty(i)) continue;
		zkSlides[k].options[i] = options[i];
	}

	zkSlideResize(k, []);
	zkFillStaticSlide(k, zkSlides[k].current);
}

function zkMoveSlide(k, n, resetInterval) {
	if (typeof zkSlides[k] === 'undefined')
		return false;
	if (typeof resetInterval === 'undefined')
		resetInterval = true;
	if (resetInterval)
		zkSlideSetInterval(k);
	zkSlides[k].queue.push(n);
	zkCheckMoveQueue();
}

function zkActualMoveSlide(k, n) {
	if (typeof n === 'number' && n < 0)
		n = n.toString();
	var forceType = false;
	if (typeof n == 'string') {
		var current = zkSlides[k].current;
		if (n.charAt(0) == '-') {
			forceType = '-';
			var moveBy = parseInt(n.substr(1));
			if (isNaN(moveBy))
				return false;
			current -= moveBy;
		} else if (n.charAt(0) == '+') {
			forceType = '+';
			var moveBy = parseInt(n.substr(1));
			if (isNaN(moveBy))
				return false;
			current += moveBy;
		} else {
			return false;
		}

		n = current;
	}

	n = zkNormalizeN(k, n);
	if (n == zkSlides[k].current)
		return true;

	switch (zkSlides[k].options['type']) {
		case 'slide':
			switch (zkSlides[k].options['direction']) {
				case 'o':
					if (forceType === '+') var type = 'right';
					else if (forceType === '-') var type = 'left';
					else if (n < zkSlides[k].current) var type = 'left';
					else var type = 'right';
					break;
				case 'v':
					if (forceType === '+') var type = 'down';
					else if (forceType === '-') var type = 'up';
					else if (n < zkSlides[k].current) var type = 'up';
					else var type = 'down';
					break;
				default:
					return false;
					break;
			}
			break;
		case 'fade':
			var type = 'fade';
			break;
		default:
			return false;
			break;
	}

	zkSlides[k].moving = true;
	var prep = zkPrepareToMove(k, n, type);
	switch (type) {
		case 'fade':
			for (var i in prep) {
				if (!prep.hasOwnProperty(i)) continue;
				prep[i].style.opacity = 1;
			}

			var currents = zkSlides[k].mainCont.querySelectorAll('[data-zkslide-' + k + '-current]');
			for (var i in currents) {
				if (!currents.hasOwnProperty(i)) continue;
				currents[i].style.opacity = 0;
			}

			var forResize = prep;
			break;
		case 'left':
		case 'up':
			zkSlides[k].cont.className = zkSlides[k].cont.getAttribute('data-default-class') + ' animate';
			if (type == 'up')
				zkSlides[k].cont.style.top = '0px';
			else
				zkSlides[k].cont.style.left = '0px';
			var forResize = prep;
			break;
		case 'right':
		case 'down':
			zkSlides[k].cont.className = zkSlides[k].cont.getAttribute('data-default-class') + ' animate';
			var w = 0, c = 0, forResize = [];
			for (var i in zkSlides[k].cont.children) {
				if (!zkSlides[k].cont.children.hasOwnProperty(i)) continue;
				c++;
				if (c < prep) {
					w += type === 'down' ? zkSlides[k].cont.children[i].offsetHeight : zkSlides[k].cont.children[i].offsetWidth;
				}
				if (c >= prep) {
					forResize.push(zkSlides[k].cont.children[i]);
				}
			}
			if (type === 'down')
				zkSlides[k].cont.style.top = (-w) + 'px';
			else
				zkSlides[k].cont.style.left = (-w) + 'px';
			break;
	}

	zkSlideResize(k, forResize);

	setTimeout((function (k, n) {
		return function () {
			zkFillStaticSlide(k, n);
			if (zkSlides[k].options['callback'])
				zkSlides[k].options['callback'].call(zkSlides[k], n);
			if (zkSlides[k].options['type'] === 'slide') {
				zkSlides[k].cont.className = zkSlides[k].cont.getAttribute('data-default-class');
				zkSlides[k].cont.style.left = '0px';
				zkSlides[k].cont.style.top = '0px';
			}
			zkSlides[k].moving = false;
			zkCheckMoveQueue();
		};
	})(k, n), 700);
}

function zkCheckMoveQueue() {
	for (var k in zkSlides) {
		if (!zkSlides.hasOwnProperty(k)) continue;
		if (zkSlides[k].moving) continue;
		if (zkSlides[k].queue.length > 0) {
			var n = zkSlides[k].queue.shift();
			zkActualMoveSlide(k, n);
		}
	}
}

function zkFillStaticSlide(k, from) {
	if (typeof zkSlides[k] === 'undefined')
		return false;

	var divsForResize = [];

	var offset = 0;
	zkSlides[k].cont.innerHTML = '';

	var min = Math.min(zkGetVisibleSlides(k), zkSlides[k].slides.length);
	for (i = 0; i < min; i++) {
		var n = zkNormalizeN(k, from + i);
		var div = zkGetSlideDiv(k, n, offset);
		div = zkSlides[k].cont.appendChild(div);
		div.setAttribute('data-zkslide-' + k + '-current', i);
		div.setAttribute('data-zkslide-' + k + '-n', n);
		divsForResize.push(div);
		offset += div.offsetWidth;
	}

	zkSlideResize(k, divsForResize);

	if (zkSlides[k].options['type'] === 'fade') {
		for (var i in divsForResize) {
			if (!divsForResize.hasOwnProperty(i)) continue;
			div.style.position = 'absolute';
		}
	}

	zkSlides[k].current = from;
}

function zkSlideResize(k, divs) {
	if (typeof zkSlides[k] === 'undefined')
		return false;

	var w = zkSlides[k].options['width'], h = zkSlides[k].options['height'], totalW = 0, totalH = 0, maxW = 0, maxH = 0;

	var prevW = zkSlides[k].mainCont.offsetWidth;
	var prevH = zkSlides[k].mainCont.offsetHeight;

	if (w === null)
		zkSlides[k].mainCont.style.width = 'auto';
	if (h === null) {
		zkSlides[k].mainCont.style.marginBottom = zkSlides[k].mainCont.offsetHeight + 'px';
		zkSlides[k].mainCont.style.height = 'auto';
	}

	divs.forEach(function (div) {
		totalW += div.offsetWidth;
		totalH += div.offsetHeight;
		maxW = Math.max(maxW, div.offsetWidth);
		maxH = Math.max(maxH, div.offsetHeight);

		Array.from(div.querySelectorAll('img')).forEach(function (img) {
			img.addEventListener('load', zkSlideDebounce(function () {
				zkSlideResize(k, divs);
			}, 200));
		});
	});

	if (w === null) {
		if (zkSlides[k].options['type'] === 'fade' || zkSlides[k].options['direction'] === 'o') {
			var width = totalW + 'px';
		} else {
			var width = maxW + 'px';
		}
	} else {
		var width = w;
	}

	if (h === null) {
		zkSlides[k].mainCont.style.marginBottom = '0';

		if (zkSlides[k].options['type'] === 'fade' || zkSlides[k].options['direction'] === 'o') {
			var height = maxH + 'px';
		} else {
			var height = totalH + 'px';
		}
	} else {
		var height = h;
	}

	if (prevW)
		zkSlides[k].mainCont.style.width = prevW + 'px';
	if (prevH)
		zkSlides[k].mainCont.style.height = prevH + 'px';
	zkSlides[k].mainCont.offsetWidth; // Reflow
	zkSlides[k].mainCont.style.width = width;
	zkSlides[k].mainCont.style.height = height;
	if (zkSlides[k].options['type'] === 'slide') {
		zkSlides[k].cont.style.minWidth = width;
		zkSlides[k].cont.style.minHeight = height;
	}
}

function zkGetSlideDiv(k, n, offset) {
	if (typeof zkSlides[k] === 'undefined')
		return false;
	if (typeof zkSlides[k].slides[n - 1] === 'undefined')
		return false;
	if (typeof offset === 'undefined')
		offset = 0;
	var div = document.createElement('div');
	div.className = 'zkslide-single';
	div.innerHTML = zkSlides[k].slides[n - 1].innerHTML;
	if (zkSlides[k].options['type'] === 'fade') {
		div.style.top = '0px';
		div.style.left = offset + 'px';
		div.style.opacity = 1;
	}

	var dimension = zkGetSingleSlideDimension(k);
	if (dimension.w !== null)
		div.style.width = dimension.w;
	if (dimension.h !== null)
		div.style.height = dimension.h;

	return div;
}

function zkPrepareToMove(k, from, type) {
	if (typeof zkSlides[k] === 'undefined')
		return false;

	switch (type) {
		case 'fade':
			var offset = 0, divs = [];
			for (i = 0; i < zkGetVisibleSlides(k); i++) {
				var n = zkNormalizeN(k, from + i);
				var div = zkGetSlideDiv(k, n, offset);
				div.style.zIndex = -1;
				div.style.opacity = 0;
				div = zkSlides[k].cont.appendChild(div);
				div.style.position = 'absolute';
				divs.push(div);
				offset += div.offsetWidth;
			}
			return divs;
			break;
		case 'left':
		case 'up':
			// To scroll towards the left/upperwards, I just add as many slide as needed to cover the range from the requested slide to the last slide in the view
			var end_vis = zkNormalizeN(k, zkSlides[k].current + zkGetVisibleSlides(k) - 1), n = parseInt(from);
			zkSlides[k].cont.innerHTML = '';

			var last_one = false, n_found = false, w = 0, divs = [];
			do {
				var div = zkGetSlideDiv(k, n);
				div = zkSlides[k].cont.appendChild(div);

				if (n == zkSlides[k].current) {
					n_found = true;
				} else if (!n_found) {
					w += type === 'up' ? div.offsetHeight : div.offsetWidth;
				}

				if (divs.length < zkGetVisibleSlides(k))
					divs.push(div);

				if (last_one)
					break;
				n = zkNormalizeN(k, n + 1);
				if (n == end_vis)
					last_one = true;
			} while (true);

			if (type === 'up') {
				zkSlides[k].cont.style.top = (-w) + 'px';
			} else {
				zkSlides[k].cont.style.left = (-w) + 'px';
			}
			zkSlides[k].cont.offsetWidth; // Reflow

			return divs;
			break;
		case 'right':
		case 'down':
			// To move towards the right/downwards...
			var n = parseInt(from), scrollTo = 0;

			// I need to add, at the end of the sliders, as many as slides are needed to reach the end of the new slider state
			var c = zkSlides[k].current, end_vis = zkNormalizeN(k, zkSlides[k].current + zkGetVisibleSlides(k) - 1),
				end_vis_reached = false, new_end = null, avoidInfiniteLoops = 0;
			while (true) {
				if (end_vis_reached) {
					var div = zkGetSlideDiv(k, c);
					div = zkSlides[k].cont.appendChild(div);
				}

				if (c === end_vis)
					end_vis_reached = true;

				if (new_end === null)
					scrollTo++;

				if (c === n) {
					new_end = zkNormalizeN(k, c + zkGetVisibleSlides(k) - 1);
				}

				if (c === new_end)
					break;

				c = zkNormalizeN(k, c + 1);

				avoidInfiniteLoops++;
				if (avoidInfiniteLoops === 1000) // Security measure
					return 0;
			}

			return scrollTo;
			break;
	}
}

function zkNormalizeN(k, n) {
	if (typeof zkSlides[k] === 'undefined')
		return false;
	if (zkSlides[k].slides.length === 0)
		return n;

	while (n < 1)
		n += zkSlides[k].slides.length;
	while (n > zkSlides[k].slides.length)
		n -= zkSlides[k].slides.length;
	return n;
}

function zkGetSingleSlideDimension(k) {
	if (typeof zkSlides[k] === 'undefined')
		return false;

	if (zkSlides[k].options['force-width'] === 'true' && zkSlides[k].options['width'] !== null && (zkSlides[k].options['type'] === 'fade' || zkSlides[k].options['direction'] === 'o')) {
		var w = Math.floor(zkSlides[k].mainCont.offsetWidth / zkGetVisibleSlides(k)) + 'px';
	} else {
		var w = null;
	}

	if (zkSlides[k].options['force-height'] === 'true' && zkSlides[k].options['height'] !== null && (zkSlides[k].options['type'] === 'slide' && zkSlides[k].options['direction'] === 'v')) {
		var h = Math.floor(zkSlides[k].mainCont.offsetHeight / zkGetVisibleSlides(k)) + 'px';
	} else {
		var h = null;
	}

	return {'w': w, 'h': h};
}

function zkSlideSetInterval(k) {
	if (zkSlides[k].options['interval']) {
		if (zkSlides[k].interval)
			clearInterval(zkSlides[k].interval);

		zkSlides[k].interval = setInterval((function (k) {
			return function () {
				zkMoveSlide(k, zkSlides[k].options['step'] > 0 ? '+' + zkSlides[k].options['step'] : zkSlides[k].options['step'], false);
			};
		})(k), zkSlides[k].options['interval']);
	}
}

function zkSlideDebounce(func, wait, immediate) {
	var timeout;
	return function () {
		var context = this, args = arguments;
		var later = function () {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
}

function zkGetVisibleSlides(k) {
	if (typeof zkSlides[k] === 'undefined')
		return 1;

	if (typeof zkSlides[k].options['visible'] === 'object') {
		var sizes = Object.keys(zkSlides[k].options['visible']).sort(function (a, b) {
			a = parseInt(a);
			b = parseInt(b);

			if (isNaN(a))
				return 1;
			if (isNaN(b))
				return -1;
			if (a > b)
				return 1;
			if (a < b)
				return -1;
			return 0;
		});

		var toReturn = null;
		sizes.forEach(function (s) {
			if (toReturn !== null)
				return;

			var numericS = parseInt(s);

			if (s === 'default' || window.innerWidth < numericS)
				toReturn = parseInt(zkSlides[k].options['visible'][s]);
		});

		return (toReturn && !isNaN(toReturn)) ? toReturn : 1;
	} else {
		return parseInt(zkSlides[k].options['visible']);
	}
}