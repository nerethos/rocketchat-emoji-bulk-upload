Rocket.Chat Custom Emoji Importer
=================================

This repository contains a Node.js script to import custom emojis from a YAML file into a Rocket.Chat instance. The script uses the Rocket.Chat API, making it easy to bulk import custom emojis without directly accessing the database. It also supports using a `.env` file to store the Rocket.Chat server URL, admin username, and password.

Features
--------

*   Import custom emojis from a remote YAML file
    
    The script allows you to easily import custom emojis from a remote YAML file by providing the file's URL. The YAML file should contain the emoji names and image sources in a well-structured format.
    
*   Import BetterTTV emotes
    
    Instead of a YAML pack, you can import emotes directly from the BetterTTV API in one of three ways:
    
    *   `betterttv` (or `betterttv:global`) — all current [global emotes](https://betterttv.com/emotes/global) (a small, fixed, curated set).
    *   `betterttv:popular` — a hand-picked list of well-known shared/channel emotes that aren't part of the global set (e.g. `catJAM`, `PagMan`, `monkaW`). BetterTTV's public API has no popularity ranking and no bulk "all shared emotes" endpoint, and the same emote code can be uploaded independently by many different users, so this picks the first exact-code match returned by BetterTTV's search — a valid upload of that emote, not necessarily "the" canonical one. Edit `BETTERTTV_POPULAR_SHARED_EMOTE_CODES` in `import-custom-emojis.js` to change the list.
    *   `betterttv:channel:<twitch-channel-id>` — every emote (channel + shared) added to a specific Twitch channel's BetterTTV set. This requires the channel's **numeric** Twitch user ID, not their username — BetterTTV's API doesn't resolve usernames. You can look this up with Twitch's own API, or with a third-party tool such as [ivr.fi](https://api.ivr.fi/v2/twitch/user?login=USERNAME) (unaffiliated with this project — use at your own discretion).
    
*   Uses the Rocket.Chat API for easy and secure integration
    
    This script interacts with your Rocket.Chat server using the official API, ensuring a secure and straightforward integration process. You can authenticate with an admin username and password, or with a Personal Access Token.
    
*   Command-line interface for user input
    
    The script uses a simple command-line interface to gather required information, such as the YAML file URL, Rocket.Chat server URL, and admin credentials, making it easy to run and configure.
    
*   Automatic download and upload of custom emoji images
    
    The script takes care of downloading the custom emoji images from the URLs specified in the YAML file and uploading them to your Rocket.Chat server. This automated process simplifies the bulk import of custom emojis.
    
*   Bulk import support
    
    This script is designed to handle multiple custom emojis at once, allowing you to import a large number of emojis in a single run, saving you time and effort.
    
*   Support for `.env` file to store server URL and admin credentials
    
    You can create a `.env` file in the project folder to store your Rocket.Chat server URL, admin username, and password. This helps to keep your credentials secure and simplifies running the script, as you won't need to input these values manually each time.
    
*   Skipping Existing Emojis
    
    This script has been updated to check for existing custom emojis on your Rocket.Chat server before uploading new ones. If an emoji from the YAML file is already present on the server, the script will skip uploading that emoji and print a message to inform you that it has been skipped. This helps to prevent duplicate emojis from being uploaded if you run the script multiple times using the same YAML file.

Requirements
------------

*   Node.js
*   npm (usually comes with Node.js)
*   A Rocket.Chat instance with admin access

Dependencies
------------

The following Node.js packages are used in this script:

*   `request`: To perform HTTP requests and interact with the Rocket.Chat API
*   `js-yaml`: To parse YAML files
*   `readline`: To read user inputs from the command line
*   `dotenv`: To load environment variables from a `.env` file

Installation
------------

1.  Clone this repository:
    
    ```bash
    git clone https://github.com/anefzaoui/rocketchat-emoji-bulk-upload.git
    cd rocketchat-emoji-bulk-upload
    ```
    
2.  Install the required dependencies:
    
    `npm install`

Usage
-----

1.  Optionally, create a `.env` file in the project directory with the following content:
    

    ```ini
    ROCKETCHAT_SERVER_URL=https://your-rocketchat-server-url 
    ADMIN_USERNAME=your-admin-username
    ADMIN_PASSWORD=your-admin-password
    ```
    
    Replace the placeholder values with your actual Rocket.Chat server URL, admin username, and password. The script will use these values if they are set in the `.env` file, otherwise, it will prompt the user to input them.

    **Note**: There is a `.env.example` file included in this repository that you can use as a template. Simply rename it to `.env` and fill in your information.

    **Personal Access Token authentication**: Instead of a username and password, you can authenticate with a Rocket.Chat Personal Access Token by setting `ROCKETCHAT_AUTH_TOKEN` and `ROCKETCHAT_USER_ID` in your `.env` file. Both must be set together, or the script will exit with an error. When set, these take priority and the username/password prompts are skipped entirely.

    ```ini
    ROCKETCHAT_AUTH_TOKEN=your-personal-access-token
    ROCKETCHAT_USER_ID=your-user-id
    ```

    Generate a token from **My Account > Personal Access Tokens** in Rocket.Chat; your user ID can be found via **Admin > Users** or the `/api/v1/me` endpoint.

    
2.  Run the script:
    
    `node import-custom-emojis.js`
    
3.  If you haven't provided the necessary information in the `.env` file, follow the prompts and provide the required information:
    
    *   Emoji source: a YAML pack URL, or one of `betterttv`, `betterttv:popular`, `betterttv:channel:<twitch-channel-id>` (see [Import BetterTTV emotes](#features) above)
    *   Rocket.Chat server URL
    *   Rocket.Chat admin username
    *   Rocket.Chat admin password

The script will then fetch the emoji source and start downloading and uploading the custom emojis to your Rocket.Chat instance. The process may take some time, depending on the number of custom emojis and their file sizes. After all emojis are uploaded, the script will display a success message — unless one or more emojis were skipped or failed, in which case that count won't be printed (each success/skip/failure is still logged individually).

**Note on BetterTTV emote names**: A handful of BetterTTV global emote codes contain characters Rocket.Chat won't accept in an emoji name (e.g. `:tf:`, `M&Mjc`, `D:`). These will fail to upload with an error printed to the console; every other emote is unaffected and continues uploading normally.

Emoji Packs
------------
*   [twitch](packs/twitch.yaml) — regenerated from Twitch's official Helix API (`GET /helix/chat/emotes/global`), current as of this writing. The [lambtron/emojipacks](https://github.com/lambtron/emojipacks) copy below is stale (its `pogchamp` entry, among others, 404s — Twitch's real global emote set has moved on since that repo was last updated) and is left in the list for the other packs it hosts. Since the script needs an actual URL rather than a repo-relative path, use this file's "Raw" link from GitHub as the emoji source when prompted.
*   [animals](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/animals.yaml)
*   [clippy](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/clippy.yaml)
*   [fika](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/fika.yaml)
*   [frontend](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/frontend.yaml)
*   [harrypotter](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/harrypotterhouses.yaml)
*   [mario](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/mario-8bit.yaml)
*   [occupy](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/occupy.yaml)
*   [officespace](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/officespace.yaml)
*   [omnom](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/omnom.yaml)
*   [futurama](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/futurama.yaml)
*   [food](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/food.yaml)
*   [skype](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/skype.yaml)
*   [starwars](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/starwars.yaml)
*   [startups](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/startups.yaml)
*   [businessfish](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/businessfish.yaml)
*   [hipchat](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/hipchat.yaml)
*   [twitch](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/twitch.yaml)
*   [parrotparty](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/parrotparty.yaml) ([Parrot](http://cultofthepartyparrot.com/) [Paint](http://cultofthepartyparrot.com/paint/))
*   [Finland](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/finland.yaml)
*   [pokemongo: items](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/pokemongo.yaml)
*   [Pokémon Go: Pokémon](https://raw.githubusercontent.com/Templarian/slack-emoji-pokemon/master/pokemon.yaml) ([Prefixed `pokemon-*`](https://raw.githubusercontent.com/Templarian/slack-emoji-pokemon/master/pokemon-prefix.yaml))
*   [politipack](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/politipack.yaml)
*   [nekoatsume](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/nekoatsume.yaml)
*   [octicons](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/octicons.yaml)
*   [pokemon](https://raw.githubusercontent.com/jaylynch/pokemoji/master/pokemon-by-name.yaml)
*   [devicon](https://raw.githubusercontent.com/izumin5210/emojipack-for-devicon/master/png/devicon.yaml) ([Devicon](http://devicon.fr/))
*   [hamsterdance](https://raw.githubusercontent.com/snipe/hamsterdance-emojipack/master/hamsterdance.yaml) ([snipe/emojipacks](https://github.com/snipe/hamsterdance-emojipack))
*   [avengers](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/avengers.yaml)
*   [Shiba Stickers](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/shiba.yaml) (from Messenger)
*   [gamedevmoji](https://raw.githubusercontent.com/niksudan/gamedevmoji/master/gamedevicons.yaml)
*   [AWS simple icons](https://raw.githubusercontent.com/Surgo/aws_emojipacks/master/noprefix-emojipacks.yml)

Emoji packs from [slackmojis.com](http://www.slackmojis.com)
------------

*   [Uncategorized](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-uncategorized.yaml)
*   [Facebook Reaction](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-facebook-reaction.yaml)
*   [Logo](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-logo.yaml)
*   [Meme](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-meme.yaml)
*   [MLB](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-mlb.yaml)
*   [NBA](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-nba.yaml)
*   [NFL](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-nfl.yaml)
*   [NHL](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-nhl.yaml)
*   [NYC Subway](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-nyc-subway.yaml)
*   [Party Parrot](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-party-parrot.yaml)
*   [Pokemon](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-pokemon.yaml)
*   [Retro Game](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-retro-game.yaml)
*   [Scrabble Letters](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-scrabble-letters.yaml)
*   [Skype](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-skype.yaml)
*   [Star Wars](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-star-wars.yaml)
*   [Turntable.fm](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-turntable.fm.yaml)
*   [Yoyo](https://raw.githubusercontent.com/lambtron/emojipacks/master/packs/slackmojis-yoyo.yaml)

Contributing
------------

If you'd like to contribute to this project, feel free to submit a pull request or open an issue. Your feedback and suggestions are always welcome!

License
-------

This project is licensed under the MIT License. See the `LICENSE` file for details.

Disclaimer
----------

This script is provided as-is, with no guarantees or warranties. Use it at your own risk. Always make a backup of your data before making any changes to your Rocket.Chat instance.