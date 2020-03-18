require('dotenv').config();
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const app = express();
app.use(bodyParser.json());
const port = 3000;

const SPOTIFY_URL = 'https://api.spotify.com/v1/search';
let spotifyToken = process.env.SPOTIFY_TOKEN;

// Use util.format to replace %s with the appropriate storefront
const APPLEMUSIC_URL = 'https://api.music.apple.com/v1/catalog/%s/search';
let appleMusicToken = process.env.APPLEMUSIC_TOKEN;

////////////////////////
//  GENERAL
//////////////

//////
//  EXTRACT SEARCH TERMS
//    Given a share link, queries the appropriate provider API to
//    gather the search terms needed for Transposition.
//////
const extractSearchTerms = link => {
  return new Promise(async (resolve, reject) => {
    const provider = link.match(/\.(\w+)\./)[1];

    switch (provider) {
      // https://open.spotify.com/{type}/{id}
      case 'spotify':
        const {
          groups: {type, id},
        } = link.match(/https:\/\/open.spotify.com\/(?<type>\w+)\/(?<id>\w+)/);
        const trackInfo = await spotifyGetTrackInfo(`${type}s`, id);
        // feed into search
        resolve(trackInfo);
        break;
      case 'apple':
        break;
      default:
        console.log('unsupported');
    }
  });
};

//////
//  GENERATE TRANSPOSE LINK
//    Generates a Transpose link that opens the Transpose app on the receiver's
//    device and gets the right link for the receiver's set provider.
//////
app.get('/transpose/link', function(req, res) {
  res.send(200);
});

////////////////////////
//  SPOTIFY
//////////////

//////
//  GENERATE SPOTIFY TOKEN
//    Generates & sets a Spotify Web API access token good for 1 hour (3600s).
//
//    https://developer.spotify.com/documentation/general/guides/authorization-guide/#client-credentials-flow
//////
app.get('/spotify/generateToken', function(req, res) {
  // eslint-disable-next-line no-undef
  const buff = new Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  );
  const base64ClientData = buff.toString('base64');

  axios({
    method: 'post',
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      Authorization: `Basic ${base64ClientData}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    data: 'grant_type=client_credentials',
  })
    .then(function(response) {
      spotifyToken = response.data.access_token;
      console.log(spotifyToken);
      res.sendStatus(200);
    })
    .catch(function(error) {
      res.send(error);
    });
});

//////
//  GENERATE SPOTIFY LINK
//    Generates a Spotify link from a shared link.
//////
app.post(
  '/spotify/link',
  runAsyncWrapper(async (req, res) => {
    if (!req.body.link) {
      res.sendStatus(400);
    }

    const terms = await extractSearchTerms(req.body.link);
    res.send(terms);
    //res.sendStatus(200);
  }),
);

//////
//  GET SPOTIFY TRACK INFO
//    Gets the track info for a Spotify track by ID.
//
//    https://api.spotify.com/v1/tracks/{id}
//
//    https://developer.spotify.com/documentation/web-api/reference/tracks/get-track/
//////
const spotifyGetTrackInfo = (type, id) => {
  return axios
    .get(`https://api.spotify.com/v1/${type}/${id}`, {
      headers: {Authorization: `Bearer ${spotifyToken}`},
    })
    .then(response => {
      const artist = response.data.artists[0].name;
      const title = response.data.name;
      return `${artist} ${title}`;
    })
    .catch(error => {
      return error;
    });
};

//////
//  SEARCH FOR AN ITEM ON SPOTIFY
//    Performs a search using the Spotify Web API.
//////
app.get('/spotify/search', function(req, res) {
  axios
    .get('https://api.spotify.com/v1/search', {
      headers: {Authorization: `Bearer ${spotifyToken}`},
      params: {
        q: 'James+Brown',
        type: 'track',
        limit: 1,
      },
    })
    .then(function(response) {
      const song = response.data;

      if (!song) {
        res.send('No results');
      }

      res.send(song);
    })
    .catch(function(error) {
      res.send(error.data);
    });
});

////////////////////////
//  APPLE MUSIC
//////////////

//////
//  GENERATE APPLE MUSIC TOKEN
//    Generates and sets an Apple Music API access token good for 1 week (max 6 months).
//
//    https://developer.apple.com/documentation/applemusicapi/getting_keys_and_creating_tokens
//////
app.get('/applemusic/generateToken', function(req, res) {
  const privateKey = fs.readFileSync('MusicKitKey.p8');

  const token = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: '1w',
    issuer: process.env.APPLEMUSIC_TEAMID,
    keyid: process.env.APPLEMUSIC_KEYID,
  });

  appleMusicToken = token;
  res.sendStatus(200);
});

//////
//  SEARCH FOR AN ITEM ON APPLE MUSIC
//    Performs a search using the Apple Music API.
//
//    https://developer.apple.com/documentation/applemusicapi/search_for_catalog_resources
//////
app.get('/applemusic/search', function(req, res) {
  axios
    .get('https://api.music.apple.com/v1/catalog/us/search', {
      headers: {Authorization: `Bearer ${appleMusicToken}`},
      params: {
        term: 'James+Brown',
        types: 'songs',
        limit: 1,
      },
    })
    .then(function(response) {
      const song = response.data.results.songs.data[0];

      if (!song) {
        res.send('No results');
      }

      res.send(song);
    })
    .catch(function(error) {
      res.send(error.data);
    });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

//////
//  RUN ASYNC WRAPPER
//    Async wrapper to catch errors without try/catch
//
//    https://zellwk.com/blog/async-await-express/
//////
function runAsyncWrapper(callback) {
  return function(req, res, next) {
    callback(req, res, next).catch(next);
  };
}
