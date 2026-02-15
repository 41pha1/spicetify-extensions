const kuroshiroPath = "https://cdn.jsdelivr.net/npm/kuroshiro@1.2.0/dist/kuroshiro.min.js";
const kuromojiPath = "https://cdn.jsdelivr.net/npm/kuroshiro-analyzer-kuromoji@1.1.0/dist/kuroshiro-analyzer-kuromoji.min.js";

const dictPath = "https:/cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict";

class JapaneseTranslator {
	constructor() {
		this.includeExternal(kuroshiroPath);
		this.includeExternal(kuromojiPath);
		this.createKuroshiro();
		this.finished = false;
	}

	includeExternal(url) {
		var s = document.createElement("script");
		s.setAttribute("type", "text/javascript");
		s.setAttribute("src", url);
		var nodes = document.getElementsByTagName("*");
		var node = nodes[nodes.length - 1].parentNode;
		node.appendChild(s);
	}

	applyKuromojiFix() {
		if (typeof XMLHttpRequest.prototype.realOpen !== "undefined") return;
		XMLHttpRequest.prototype.realOpen = XMLHttpRequest.prototype.open;
		XMLHttpRequest.prototype.open = function (method, url, bool) {
			if (url.indexOf(dictPath.replace("https://", "https:/")) === 0) {
				this.realOpen(method, url.replace("https:/", "https://"), bool);
			} else {
				this.realOpen(method, url, bool);
			}
		};
	}

	async createKuroshiro() {
		if (typeof Kuroshiro === "undefined" || typeof KuromojiAnalyzer === "undefined") {
			setTimeout(this.createKuroshiro.bind(this), 50);
			return;
		}
		this.kuroshiro = new Kuroshiro.default();
		this.applyKuromojiFix();
		this.kuroshiro.init(new KuromojiAnalyzer({ dictPath: dictPath })).then(
			function () { this.finished = true; }.bind(this)
		);
	}

	async romanize(text, target = "romaji", mode = "spaced") {
		if (!this.finished) return text;
		return this.kuroshiro.convert(text, { to: target, mode: mode });
	}
}


class Romaji_Lyrics {
	static LYRIC_DIV_SELECTOR = ".lyrics-lyricsContent-text";
	static translator = new JapaneseTranslator();
	static enabled = true;
	static mode = "romaji";
	static target = "spaced";

	// Cache: original Japanese line -> romaji line
	static lineCache = new Map();
	// Track if we're doing initial bulk translation
	static bulkTranslating = false;
	// Store the last known lyrics fingerprint to detect song changes
	static lastLyricsFingerprint = null;
	// The MutationObserver watching lyrics elements
	static lyricsObserver = null;
	// The MutationObserver watching for lyrics container to appear
	static containerObserver = null;
	static styleInjected = false;

	static injectStyle() {
		if (this.styleInjected) return;
		const style = document.createElement("style");
		style.id = "romaji-lyrics-style";
		// Hide lyrics that haven't been processed yet during Japanese songs.
		// .romaji-hide is added synchronously in the MutationObserver callback
		// BEFORE the browser paints, so the Japanese text is never visible.
		style.textContent = `
			.lyrics-lyricsContent-text.romaji-hide {
				visibility: hidden !important;
			}
		`;
		document.head.appendChild(style);
		this.styleInjected = true;
	}

	static processKatakanaMarkers(text) {
		const parts = text.split('$ KStartK $');
		if (parts.length <= 1) return text;
		let result = '';
		for (let j = 0; j < parts.length; j++) {
			const part = parts[j];
			const index = part.indexOf('$ KStopK $');
			if (index === -1) {
				result += part;
			} else {
				result += part.substring(0, index).toUpperCase();
				result += part.substring(index + '$ KStopK $'.length);
			}
		}
		return result;
	}

	static isJapanese(f) {
		return /[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|\u203B/g.test(f);
	}

	/**
	 * Called synchronously from MutationObserver - MUST be fast.
	 * If we have a cached translation, replace the text immediately
	 * (before the browser paints). If not, hide the element until
	 * async translation completes.
	 */
	static handleElementSync(el) {
		if (!this.enabled || !this.translator.finished) return;

		const text = el.textContent;
		if (!text || !this.isJapanese(text)) {
			// Not Japanese - make sure it's visible
			el.classList.remove("romaji-hide");
			return;
		}

		// Check cache - if we have a translation, replace SYNCHRONOUSLY
		// This happens in the same microtask as the DOM mutation,
		// so the browser never paints the Japanese text
		if (this.lineCache.has(text)) {
			el.innerHTML = this.lineCache.get(text);
			el.classList.remove("romaji-hide");
			return;
		}

		// No cache hit - hide element and translate async
		el.classList.add("romaji-hide");
		this.translateSingleElement(el, text);
	}

	/**
	 * Async translation for a single element that wasn't in cache.
	 */
	static async translateSingleElement(el, originalText) {
		try {
			const result = await this.translator.romanize(originalText, this.mode, this.target);
			const processed = this.processKatakanaMarkers(result);
			this.lineCache.set(originalText, processed);

			// Only update if the element still has the same original text
			// (it might have been changed again by Spotify)
			if (el.textContent === originalText || el.classList.contains("romaji-hide")) {
				el.innerHTML = processed;
				el.classList.remove("romaji-hide");
			}
		} catch (e) {
			// On error, just show the original
			el.classList.remove("romaji-hide");
		}
	}

	/**
	 * Pre-translate ALL lyrics lines when a new song loads.
	 * This populates the cache so that when Spotify re-renders
	 * individual lines (active line), we can replace synchronously.
	 */
	static async bulkTranslateAll() {
		if (this.bulkTranslating || !this.translator.finished || !this.enabled) return;
		this.bulkTranslating = true;

		try {
			const divs = document.querySelectorAll(this.LYRIC_DIV_SELECTOR);
			if (!divs || divs.length === 0) return;

			for (const div of divs) {
				const text = div.textContent;
				if (!text || this.lineCache.has(text) || !this.isJapanese(text)) continue;

				const result = await this.translator.romanize(text, this.mode, this.target);
				const processed = this.processKatakanaMarkers(result);
				this.lineCache.set(text, processed);
			}

			// Now apply all cached translations at once
			for (const div of divs) {
				const text = div.textContent;
				if (text && this.lineCache.has(text)) {
					div.innerHTML = this.lineCache.get(text);
					div.classList.remove("romaji-hide");
				}
			}
		} finally {
			this.bulkTranslating = false;
		}
	}

	static startObserving() {
		// Observer for individual lyrics elements - catches Spotify re-rendering
		// lines when they become the "active" (currently sung) line
		this.lyricsObserver = new MutationObserver((mutations) => {
			if (!this.enabled || !this.translator.finished) return;

			for (const mutation of mutations) {
				if (mutation.type === 'characterData') {
					// Text content changed - find the lyrics div parent
					let el = mutation.target.parentElement;
					while (el && !el.matches(this.LYRIC_DIV_SELECTOR)) {
						el = el.parentElement;
					}
					if (el) this.handleElementSync(el);
				}

				if (mutation.type === 'childList') {
					// New nodes added - check if they're lyrics divs or contain them
					for (const node of mutation.addedNodes) {
						if (node.nodeType !== Node.ELEMENT_NODE) continue;

						if (node.matches && node.matches(this.LYRIC_DIV_SELECTOR)) {
							this.handleElementSync(node);
						}

						// Also check children
						if (node.querySelectorAll) {
							const lyricDivs = node.querySelectorAll(this.LYRIC_DIV_SELECTOR);
							for (const div of lyricDivs) {
								this.handleElementSync(div);
							}
						}
					}
				}
			}
		});

		this.watchForContainer();
	}

	static watchForContainer() {
		const attachToContainer = () => {
			const container = document.querySelector(
				".lyrics-lyricsContent-provider, .lyrics-lyrics-contentContainer, .lyrics-lyrics-contentWrapper"
			);
			if (container && !container._romajiWatching) {
				container._romajiWatching = true;
				this.lyricsObserver.observe(container, {
					childList: true,
					subtree: true,
					characterData: true
				});

				// Initial scan: process all existing lyrics
				const divs = container.querySelectorAll(this.LYRIC_DIV_SELECTOR);
				for (const div of divs) {
					this.handleElementSync(div);
				}

				// Kick off bulk pre-translation to fill cache
				this.bulkTranslateAll();
			}
		};

		// Watch for the lyrics panel appearing
		this.containerObserver = new MutationObserver(() => { attachToContainer(); });
		this.containerObserver.observe(document.body, { childList: true, subtree: true });
		attachToContainer();
	}

	// Fallback: also watch for song changes to clear/rebuild cache
	static watchSongChanges() {
		let lastUri = null;
		const check = () => {
			try {
				const data = Spicetify.Player.data;
				const uri = data && data.item && data.item.uri;
				if (uri && uri !== lastUri) {
					lastUri = uri;
					// New song - clear cache and re-translate
					this.lineCache.clear();
					// Small delay for lyrics to load
					setTimeout(() => {
						const divs = document.querySelectorAll(this.LYRIC_DIV_SELECTOR);
						for (const div of divs) this.handleElementSync(div);
						this.bulkTranslateAll();
					}, 500);
				}
			} catch (e) {}
			setTimeout(check, 1000);
		};
		check();
	}

	static addControlUI() {
		const trap = new Mousetrap();
		trap.handleKey = (character, modifiers, e) => {
			if (e.type == "keydown") {
				if (character == "tab" && modifiers.includes("ctrl")) {
					this.enabled = !this.enabled;
					this.lineCache.clear();

					if (this.enabled) {
						const divs = document.querySelectorAll(this.LYRIC_DIV_SELECTOR);
						for (const div of divs) this.handleElementSync(div);
						this.bulkTranslateAll();
					} else {
						// Disabled: show original text by reloading lyrics
						const divs = document.querySelectorAll(this.LYRIC_DIV_SELECTOR);
						for (const div of divs) div.classList.remove("romaji-hide");
					}

					Spicetify.showNotification(
						this.enabled ? "Romaji lyrics: ON" : "Romaji lyrics: OFF"
					);
				}
			}
		};
	}
}

(function romaji_lyrics() {
	new Romaji_Lyrics();
	Romaji_Lyrics.injectStyle();
	Romaji_Lyrics.addControlUI();
	Romaji_Lyrics.startObserving();
	Romaji_Lyrics.watchSongChanges();
})();
