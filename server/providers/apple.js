require('dotenv').config();
const debug = require('debug')('transpose-apple');
import fs from 'fs';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';

export default class Apple {
  token = process.env.APPLEMUSIC_TOKEN;
  teamID = process.env.APPLEMUSIC_TEAMID;
  keyID = process.env.APPLEMUSIC_KEYID;
  searchUrl = 'https://api.music.apple.com/v1/catalog/us/search';
  tokenUrl = 'https://accounts.spotify.com/api/token';

  //////  REFRESH TOKEN
  //  Generates & sets an Apple Music API access token good for 1 hour (3600s).
  //  https://developer.apple.com/documentation/applemusicapi/getting_keys_and_creating_tokens
  //////
  refreshToken() {
    const privateKey = fs.readFileSync('MusicKitKey.p8');

    const token = jwt.sign({}, privateKey, {
      algorithm: 'ES256',
      expiresIn: '1h',
      issuer: this.teamID,
      keyid: this.keyID,
    });

    // TODO: Test that the token is valid?
    debug('Token Refresh Success: %o', token);
    this.token = token;
  }

  ////// EXTRACT ELEMENT INFO
  //  Parses @link to extract element type and id.
  //  https://music.apple.com/{loc}/{type}/{title}/{album-id}?i={song-id}
  //////
  extractElementInfo(link) {
    const { groups } = link.match(
      /https:\/\/music\.apple\.com\/(?<storefront>\w+)\/(?<type>\w+)\/(?<title>[a-zA-Z0-9\-]+)\/(?<albumID>\d+)\?i\=(?<songID>\d+)/,
    );

    let elementInfo = { type: null, id: null };

    if (groups.songID) {
      elementInfo.storefront = groups.storefront;
      elementInfo.type = 'song';
      elementInfo.id = groups.songID;
    }

    debug('Element Info: %o', elementInfo);
    return elementInfo;
  }

  //////  GET ELEMENT DATA
  //  Get element of @type with @id in @storefront and parse the response
  //  https://api.music.apple.com/v1/catalog/{storefront}/{type}/{id}
  //////
  getElementData({ storefront, type, id }) {
    return axios
      .get(
        `https://api.music.apple.com/v1/catalog/${storefront}/${type}s/${id}`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
        },
      )
      .then(response => {
        switch (type) {
          case 'song':
            const song = response.data.data[0].attributes;
            //debug('Response: \n%O', song);
            const artist = song.artistName;
            const title = song.name;
            const elementData = { artist, title };
            debug('Element Data: %O', elementData);
            return elementData;
          case 'default':
            throw new Error('Type not implemented yet');
        }
      })
      .catch(error => {
        debug('Get Element Failed: \n%O', error);
        throw new Error('Get Element Failed');
      });
  }

  //////  SEARCH
  //  Query for results of @type with @query & @limit
  //  https://developer.apple.com/documentation/applemusicapi/search_for_catalog_resources
  //////
  search({ type }, query, limit = 1) {
    type = type === 'track' ? 'song' : type;
    return axios
      .get('https://api.music.apple.com/v1/catalog/us/search', {
        headers: { Authorization: `Bearer ${this.token}` },
        params: {
          term: this._formatQueryString(query),
          types: `${type}s`,
          limit: limit,
        },
      })
      .then(response => {
        //debug('Response: \n%O', response.data.results);
        //const { results } = response.data.results;
        switch (type) {
          case 'song':
            const songs = response.data.results.songs.data;
            //debug('Response: \n%O', song);
            const songLink = songs[0].attributes.url;
            debug('Link: %o', songLink);
            return songLink;
          case 'artist':
            const artists = response.data.results.artists.data;
            //debug('Response: \n%O', artists);
            const artistLink = artists[0].attributes.url;
            debug('Link: %o', artistLink);
            return artistLink;
          case 'default':
            throw new Error('Type not implemented yet');
        }
      })
      .catch(error => {
        debug('Search Failed', error);
        throw new Error('Search Failed');
      });
  }

  //////
  //  UTILITIES
  //////

  //////  FORMAT QUERY STRING
  //  Formats query string into appropriate format.
  //
  //////
  _formatQueryString(query) {
    const q = Object.values(query)
      .map(val => val)
      .join(' ');

    debug('Query String: %s', q);
    return q;
  }

  //////  GET TRACK DETAILS
  //  Extracts track details from get track response @data
  //  https://developer.spotify.com/documentation/web-api/reference/tracks/get-track/
  //////
  _getTrackDetails(data) {
    return;
  }

  //////  GET ARTIST DETAILS
  //  Extracts artist details from get artist response @data
  //  https://developer.spotify.com/documentation/web-api/reference/artists/get-artist/
  //////
  _getArtistDetails(data) {
    return;
  }

  //////  GET ALBUM DETAILS
  //  Extracts album details from get album response @data
  //  https://developer.spotify.com/documentation/web-api/reference/albums/get-artist/
  //////
  _getAlbumDetails(data) {
    return;
  }
}
