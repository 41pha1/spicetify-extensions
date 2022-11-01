# Spicetify Romaji Lyrics
[Spicetify](https://github.com/spicetify/spicetify-cli) extension to convert Japanese lyrics to Romaji. 
* Auto detects Japanese lyrics and converts them to Romaji using the included dictionary
* Support for Furigana and multi view modes planned.

# Note
Due to the included dictionary this extensions can take some time to load after first installing it from the marketplace.

## ⚙️ Install Manually (Recommended for performance)
Copy `romaji_lyrics.js` into your [Spicetify](https://github.com/spicetify/spicetify-cli) extensions directory:
| **Platform** | **Path**                                                                               |
|------------|------------------------------------------------------------------------------------------|
| **Linux**      | `~/.config/spicetify/Extensions` or `$XDG_CONFIG_HOME/.config/spicetify/Extensions/` |
| **MacOS**      | `~/.config/spicetify/Extensions` or `$SPICETIFY_CONFIG/Extensions`                   |
| **Windows**    | `%appdata%/spicetify/Extensions/`                                               |

After putting the extension file into the correct folder, run the following command to install the extension:
```
spicetify config extensions romaji_lyrics.js
spicetify apply
```

## Usage
Simply open the lyrics for a Japanese Song and Romaji Lyrics will convert the songtext within seconds.

Control options are planned in future updates.

## Credit

[Romaji Lyrics](https://github.com/41pha1/spicetify-extensions/romaji-lyrics) uses a modified version of [hexenq's](https://github.com/hexenq) [Kuroshiro](https://github.com/hexenq/kuroshiro) javascript language library to convert the lyrics client side. 

Be sure to give them some love as well!

##  More
🌟 Like it? Gimme some love!    
[![Github Stars badge](https://img.shields.io/github/stars/41pha1/spicetify-extensions?logo=github&style=social)](https://github.com/41pha1/spicetify-extensions/)

If you find any bugs or have any suggestion for improvement, please [create a new issue](https://github.com/41pha1/spicetify-extensions/issues/new/choose) on the GitHub repo.    
![https://github.com/41pha1/spicetify-romaji-lyrics/issues](https://img.shields.io/github/issues/41pha1/spicetify-extensions?logo=github)
