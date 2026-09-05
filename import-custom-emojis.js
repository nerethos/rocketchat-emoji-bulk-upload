const request = require("request");
const yaml = require("js-yaml");
const readline = require("readline");

require("dotenv").config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const BETTERTTV_GLOBAL_EMOTES_URL = "https://api.betterttv.net/3/cached/emotes/global";
const BETTERTTV_CHANNEL_EMOTES_URL = (twitchChannelId) => `https://api.betterttv.net/3/cached/users/twitch/${twitchChannelId}`;
const BETTERTTV_SHARED_SEARCH_URL = (code) => `https://api.betterttv.net/3/emotes/shared/search?query=${encodeURIComponent(code)}&offset=0&limit=10`;
// The search/single-emote endpoints 403 without a Referer; the /cached/* endpoints don't need it,
// but sending it everywhere is harmless and one less thing to reason about.
const BETTERTTV_API_HEADERS = { Referer: "https://betterttv.com/" };

// BetterTTV's public API has no popularity ranking and no bulk "all shared emotes" endpoint, so this
// is a hand-picked, verified-to-resolve list of well-known shared emotes that aren't in the global set.
const BETTERTTV_POPULAR_SHARED_EMOTE_CODES = [
  "catJAM",
  "PagMan",
  "peepoHappy",
  "monkaW",
  "Prayge",
  "widepeepoHappy",
  "POGGIES",
  "Aware",
  "pepeD",
];

const rocketchatServerUrl = process.env.ROCKETCHAT_SERVER_URL || "";
const adminUsername = process.env.ADMIN_USERNAME || "";
const adminPassword = process.env.ADMIN_PASSWORD || "";
const rocketchatAuthToken = process.env.ROCKETCHAT_AUTH_TOKEN || "";
const rocketchatUserId = process.env.ROCKETCHAT_USER_ID || "";

if ((rocketchatAuthToken && !rocketchatUserId) || (!rocketchatAuthToken && rocketchatUserId)) {
  console.error(
    `Personal access token auth requires both ROCKETCHAT_AUTH_TOKEN and ROCKETCHAT_USER_ID to be set. Missing: ${
      rocketchatAuthToken ? "ROCKETCHAT_USER_ID" : "ROCKETCHAT_AUTH_TOKEN"
    }`
  );
  process.exit(1);
}

function promptForValue(message, currentValue, callback) {
  if (currentValue) {
    callback(currentValue);
  } else {
    rl.question(message, (value) => {
      callback(value);
    });
  }
}

function inferExtension(url) {
  return url.split("/").pop().split(".").pop();
}

function fetchExistingEmojis(serverUrl, authToken, userId, callback) {
  request.get(
    {
      url: `${serverUrl}/api/v1/emoji-custom.list`,
      headers: {
        "X-Auth-Token": authToken,
        "X-User-Id": userId,
      },
      json: true,
    },
    (error, response, body) => {
      if (error) {
        console.error("Error fetching existing emojis:", error);
        return;
      }

      const existingEmojiNames = body.emojis ? body.emojis.update.map((emoji) => emoji.name) : [];
      callback(existingEmojiNames);
    }
  );
}

function fetchYamlEmojis(emojiYamlUrl, callback) {
  request(emojiYamlUrl, (error, response, body) => {
    if (error) {
      console.error("Error fetching YAML:", error);
      return;
    }

    const emojiYaml = yaml.load(body);
    const emojis = emojiYaml["emojis"].map((emoji) => ({
      name: emoji.name,
      src: emoji.src,
      ext: inferExtension(emoji.src),
    }));

    callback(emojis);
  });
}

function betterttvEmoteToEmoji(emote) {
  return {
    name: emote.code,
    src: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
    ext: emote.imageType,
  };
}

function dedupeByName(emojis) {
  const seen = new Set();
  const deduped = [];

  for (const emoji of emojis) {
    if (seen.has(emoji.name)) {
      continue;
    }

    seen.add(emoji.name);
    deduped.push(emoji);
  }

  return deduped;
}

function fetchGlobalBetterttvEmotes(callback) {
  request.get({ url: BETTERTTV_GLOBAL_EMOTES_URL, headers: BETTERTTV_API_HEADERS, json: true }, (error, response, body) => {
    if (error) {
      console.error("Error fetching BetterTTV global emotes:", error);
      return;
    }

    if (!Array.isArray(body)) {
      console.error("Unexpected response from BetterTTV API:", body);
      return;
    }

    callback(body.map(betterttvEmoteToEmoji));
  });
}

function fetchBetterttvChannelEmotes(twitchChannelId, callback) {
  request.get({ url: BETTERTTV_CHANNEL_EMOTES_URL(twitchChannelId), headers: BETTERTTV_API_HEADERS, json: true }, (error, response, body) => {
    if (error) {
      console.error("Error fetching BetterTTV channel emotes:", error);
      return;
    }

    if (!body || (!Array.isArray(body.channelEmotes) && !Array.isArray(body.sharedEmotes))) {
      console.error("Unexpected response from BetterTTV API:", body);
      return;
    }

    const emotes = [...(body.channelEmotes || []), ...(body.sharedEmotes || [])];
    callback(dedupeByName(emotes.map(betterttvEmoteToEmoji)));
  });
}

function searchBetterttvSharedEmote(code, callback) {
  request.get({ url: BETTERTTV_SHARED_SEARCH_URL(code), headers: BETTERTTV_API_HEADERS, json: true }, (error, response, body) => {
    if (error) {
      console.error(`Error searching for BetterTTV emote ${code}:`, error);
      callback(null);
      return;
    }

    if (!Array.isArray(body)) {
      console.error(`Unexpected response searching for BetterTTV emote ${code}:`, body);
      callback(null);
      return;
    }

    const match = body.find((emote) => emote.code === code);

    if (!match) {
      console.error(`Could not find a BetterTTV shared emote with the exact code "${code}"`);
      callback(null);
      return;
    }

    callback(match);
  });
}

function fetchPopularBetterttvSharedEmotes(callback) {
  let remaining = BETTERTTV_POPULAR_SHARED_EMOTE_CODES.length;
  const matches = new Array(remaining);

  BETTERTTV_POPULAR_SHARED_EMOTE_CODES.forEach((code, index) => {
    searchBetterttvSharedEmote(code, (match) => {
      matches[index] = match;
      remaining--;

      if (remaining === 0) {
        callback(dedupeByName(matches.filter(Boolean).map(betterttvEmoteToEmoji)));
      }
    });
  });
}

function uploadEmojiList(serverUrl, authToken, userId, emojis) {
  fetchExistingEmojis(serverUrl, authToken, userId, (existingEmojiNames) => {
    let uploadedEmojisCount = 0;

    for (const emoji of emojis) {
      const { name, src: url, ext } = emoji;

      if (existingEmojiNames.includes(name)) {
        console.log(`Emoji ${name} already exists, skipping upload`);
        continue;
      }

      request.get(url, { encoding: null }, (imageError, imageResponse, imageData) => {
        if (imageError) {
          console.error("Error downloading image:", imageError);
          return;
        }

        request.post(
          {
            url: `${serverUrl}/api/v1/emoji-custom.create`,
            headers: {
              "X-Auth-Token": authToken,
              "X-User-Id": userId,
            },
            formData: {
              name,
              aliases: "",
              emoji: {
                value: imageData,
                options: {
                  filename: `${name}.${ext}`,
                  contentType: `image/${ext}`,
                },
              },
            },
          },
          (uploadError, uploadResponse, uploadBody) => {
            if (uploadError) {
              console.error("Error uploading emoji:" + name + " - Error: ", uploadError);
              return;
            }

            const uploadResponseBody = JSON.parse(uploadBody);

            if (!uploadResponseBody.success) {
              console.error("Error uploading emoji: " + name + " - Error: ", uploadResponseBody.error);
              return;
            }

            console.log(`Successfully added a new emoji: ${name}`);

            uploadedEmojisCount++;

            if (uploadedEmojisCount === emojis.length) {
              console.log(`Successfully added ${uploadedEmojisCount} new emojis`);
            }
          }
        );
      });
    }
  });
}

promptForValue(
  "Emoji source? (YAML pack URL, 'betterttv' for global emotes, 'betterttv:popular' for popular shared emotes, or 'betterttv:channel:<twitch-channel-id>') ",
  "",
  (emojiSource) => {
    promptForValue("Rocket.Chat server URL? ", rocketchatServerUrl, (finalRocketchatServerUrl) => {
      function proceedWithAuth(callback) {
        if (rocketchatAuthToken && rocketchatUserId) {
          rl.close();
          callback(rocketchatAuthToken, rocketchatUserId);
          return;
        }

        promptForValue("Rocket.Chat admin username? ", adminUsername, (finalAdminUsername) => {
          promptForValue("Rocket.Chat admin password? ", adminPassword, (finalAdminPassword) => {
            rl.close();

            // Login to Rocket.Chat
            request.post(
              {
                url: `${finalRocketchatServerUrl}/api/v1/login`,
                json: {
                  user: finalAdminUsername,
                  password: finalAdminPassword,
                },
              },
              (loginError, loginResponse, loginBody) => {
                if (loginError || !loginBody.data) {
                  console.error("Error logging in:", loginError || loginBody.message);
                  return;
                }

                callback(loginBody.data.authToken, loginBody.data.userId);
              }
            );
          });
        });
      }

      proceedWithAuth((authToken, userId) => {
        const onEmojis = (emojis) => uploadEmojiList(finalRocketchatServerUrl, authToken, userId, emojis);

        const source = emojiSource.trim();
        const lowerSource = source.toLowerCase();
        const channelPrefix = "betterttv:channel:";

        if (lowerSource === "betterttv" || lowerSource === "betterttv:global") {
          fetchGlobalBetterttvEmotes(onEmojis);
        } else if (lowerSource === "betterttv:popular") {
          fetchPopularBetterttvSharedEmotes(onEmojis);
        } else if (lowerSource.startsWith(channelPrefix)) {
          const twitchChannelId = source.slice(channelPrefix.length).trim();
          fetchBetterttvChannelEmotes(twitchChannelId, onEmojis);
        } else {
          fetchYamlEmojis(source, onEmojis);
        }
      });
    });
  }
);
