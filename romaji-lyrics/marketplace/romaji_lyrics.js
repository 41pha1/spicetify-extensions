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

	/**
	 * Fix an issue with kuromoji when loading dict from external urls
	 * Adapted from: https://github.com/mobilusoss/textlint-browser-runner/pull/7
	 */
	applyKuromojiFix() {
        if(typeof XMLHttpRequest.prototype.realOpen !== "undefined")
            return;
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
			//Waiting for JSDeliver to load Kuroshiro and Kuromoji
			setTimeout(this.createKuroshiro.bind(this), 50);
			return;
		}

		this.kuroshiro = new Kuroshiro.default();

		this.applyKuromojiFix();

		this.kuroshiro.init(new KuromojiAnalyzer({ dictPath: dictPath })).then(
			function () {
				this.finished = true;
			}.bind(this)
		);
	}

	async romanize(text, target = "romaji", mode = "spaced") {
		if (!this.finished) {
			setTimeout(this.romajifyText.bind(this), 100, text, target, mode);
			return;
		}

		return this.kuroshiro.convert(text, {
			to: target,
			mode: mode
		});
	}
}


class Romaji_Lyrics
{
    static LYRIC_DIV_SELECTOR = "div.lyrics-lyricsContent-lyric";
    static translator = new JapaneseTranslator();
    static translated_lyrics = null;
    static original_lyrics = null;
    static enabled = true;
    static mode = "romaji"
    static target = "spaced";

    static eventLoop()
    {
        const currentLyrics = this.getLyrics();
        
        if(!this.original_lyrics || !(currentLyrics == this.translated_lyrics)){
            this.original_lyrics = currentLyrics;
            this.translateLyrics(this.original_lyrics);
        }
    
        setTimeout(this.eventLoop.bind(this), 50)
    }

    static addControlUI()
    {
        const trap = new Spicetify.Mousetrap();
        trap.handleKey = (character, modifiers, e) => {
			if (e.type == "keydown") {
				if(character == "tab" && modifiers.includes("ctrl"))
                {
                    this.enabled = !this.enabled;
                    Romaji_Lyrics.translateLyrics(Romaji_Lyrics.original_lyrics);
                }
			}
		};
    }
    
    static getLyrics() 
    {
        if (!this.translator.finished) return null;
    
        const lyrics_div = document.querySelectorAll(Romaji_Lyrics.LYRIC_DIV_SELECTOR);

        if(!lyrics_div) return null;
    
        var lyrics = "";
        for (let lyric_div of lyrics_div) lyrics += lyric_div.innerHTML + "\n";
        lyrics = lyrics.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
        return lyrics;
    }
    
    static translateLyrics(lyrics) {
        if(!this.translator.finished || !this.isJapanese(lyrics)) return;

        if(!this.enabled){
            this.translated_lyrics = this.original_lyrics;
            Romaji_Lyrics.applyTranslation();
            return;
        }
    
        this.translator.romanize(lyrics, this.mode, this.target).then((r) => {Romaji_Lyrics.translated_lyrics = r; Romaji_Lyrics.applyTranslation()});
    }
    
    static applyTranslation()
    {
        const lyrics_div = document.querySelectorAll(Romaji_Lyrics.LYRIC_DIV_SELECTOR);
        if(!lyrics_div || !this.translated_lyrics) return;
    
        var lyrics_array = this.translated_lyrics.split("\n");
        for (var j = 0; j < lyrics_div.length; j++) lyrics_div[j].innerHTML = lyrics_array[j];
    }
    
    static isJapanese(f) {
        return /[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|\u203B/g.test(f);
    }
}


(function romaji_lyrics() {
    new Romaji_Lyrics();
    Romaji_Lyrics.addControlUI();
    Romaji_Lyrics.eventLoop();
})();