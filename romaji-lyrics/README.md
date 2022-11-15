# Spicetify Romaji Lyrics
[Spicetify](https://github.com/spicetify/spicetify-cli) extension to convert Japanese lyrics to Romaji. 
* Auto detects Japanese lyrics and converts them to Romaji using the included dictionary
* This extension works for the spotify lyrics, if you are interested in using this for Lyrics-plus, check out my [fork of the cli.](https://github.com/41pha1/spicetify-cli/tree/lyrics-converter/CustomApps/lyrics-plus)
  > simply replace spicetify\CustomApps\lyrics-plus with my version of lyrics-plus.

# Note
Due to the included dictionary this extensions can take some time to load after first installing it from the marketplace.

## ⚙️ Install Manually
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
Simply open the lyrics for a Japanese Song and Romaji Lyrics will convert the songtext.

You can toggle the conversion by pressing ctrl + tab.

## Credit

[Romaji Lyrics](https://github.com/41pha1/spicetify-extensions/tree/main/romaji-lyrics) uses a modified version of [hexenq's](https://github.com/hexenq) [Kuroshiro](https://github.com/hexenq/kuroshiro) javascript language library to convert the lyrics client side. 

Be sure to give them some love as well!

##  More
🌟 Like it? Gimme some love!    
[![Github Stars badge](https://img.shields.io/github/stars/41pha1/spicetify-extensions?logo=github&style=social)](https://github.com/41pha1/spicetify-extensions/)

If you find any bugs or have any suggestion for improvement, please [create a new issue](https://github.com/41pha1/spicetify-extensions/issues/new/choose) on the GitHub repo.    
![https://github.com/41pha1/spicetify-romaji-lyrics/issues](https://img.shields.io/github/issues/41pha1/spicetify-extensions?logo=github)
